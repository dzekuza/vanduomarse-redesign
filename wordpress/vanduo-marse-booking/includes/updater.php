<?php
/**
 * Self-hosted updates. Every app deploy publishes /wordpress/vanduo-marse-booking.json
 * (version manifest) and the zip next to it (scripts/build-wp-plugin.mts). The
 * plugin's `Update URI` header tells WordPress not to ask wordpress.org; core
 * calls the update_plugins_{host} filter instead, and shows "Update now" (and
 * the auto-update toggle) on the Plugins page when the app has a newer version.
 */

defined( 'ABSPATH' ) || exit;

define( 'VM_BOOKING_SLUG', 'vanduo-marse-booking' );
define( 'VM_BOOKING_MANIFEST_CACHE', 'vm_booking_update_manifest' );
/** Must match the host in the plugin's `Update URI` header. */
define( 'VM_BOOKING_UPDATE_HOST', 'vanduomarse-redesign.vercel.app' );

/** The app's manifest, cached for 6 hours (1 hour after a failed fetch); null when unavailable. */
function vm_booking_update_manifest() {
	$cached = get_transient( VM_BOOKING_MANIFEST_CACHE );
	if ( false !== $cached ) {
		return $cached ? $cached : null;
	}

	$origin   = vm_booking_app_origin();
	$manifest = null;
	if ( '' !== $origin ) {
		$response = wp_remote_get( $origin . '/wordpress/' . VM_BOOKING_SLUG . '.json', array( 'timeout' => 8 ) );
		if ( ! is_wp_error( $response ) && 200 === wp_remote_retrieve_response_code( $response ) ) {
			$data = json_decode( wp_remote_retrieve_body( $response ), true );
			// The package must be a path on the app itself, never a URL from elsewhere.
			if ( is_array( $data ) && ! empty( $data['version'] ) && isset( $data['package'] ) && 0 === strpos( (string) $data['package'], '/wordpress/' ) ) {
				$manifest = $data;
			}
		}
	}

	set_transient( VM_BOOKING_MANIFEST_CACHE, $manifest ? $manifest : array(), $manifest ? 6 * HOUR_IN_SECONDS : HOUR_IN_SECONDS );
	return $manifest;
}

function vm_booking_package_url( $manifest ) {
	return vm_booking_app_origin() . $manifest['package'];
}

/** Core asks this for plugins whose Update URI host matches; it compares versions itself. */
add_filter(
	'update_plugins_' . VM_BOOKING_UPDATE_HOST,
	function ( $update, $plugin_data, $plugin_file ) {
		if ( plugin_basename( VM_BOOKING_FILE ) !== $plugin_file ) {
			return $update;
		}
		$manifest = vm_booking_update_manifest();
		if ( ! $manifest ) {
			return $update;
		}
		return array(
			'id'           => VM_BOOKING_UPDATE_HOST . '/' . VM_BOOKING_SLUG,
			'slug'         => VM_BOOKING_SLUG,
			'version'      => (string) $manifest['version'],
			'url'          => vm_booking_app_origin(),
			'package'      => vm_booking_package_url( $manifest ),
			'requires'     => isset( $manifest['requires'] ) ? (string) $manifest['requires'] : '',
			'requires_php' => isset( $manifest['requires_php'] ) ? (string) $manifest['requires_php'] : '',
			'tested'       => isset( $manifest['tested'] ) ? (string) $manifest['tested'] : '',
		);
	},
	10,
	3
);

/** "View details" popup on the Plugins and Updates pages. */
add_filter(
	'plugins_api',
	function ( $result, $action, $args ) {
		if ( 'plugin_information' !== $action || ! isset( $args->slug ) || VM_BOOKING_SLUG !== $args->slug ) {
			return $result;
		}
		$manifest = vm_booking_update_manifest();
		if ( ! $manifest ) {
			return $result;
		}
		return (object) array(
			'name'          => isset( $manifest['name'] ) ? (string) $manifest['name'] : 'Vanduo Marse rezervacijos',
			'slug'          => VM_BOOKING_SLUG,
			'version'       => (string) $manifest['version'],
			'author'        => 'Vanduo Marse',
			'homepage'      => vm_booking_app_origin(),
			'requires'      => isset( $manifest['requires'] ) ? (string) $manifest['requires'] : '',
			'requires_php'  => isset( $manifest['requires_php'] ) ? (string) $manifest['requires_php'] : '',
			'tested'        => isset( $manifest['tested'] ) ? (string) $manifest['tested'] : '',
			'last_updated'  => isset( $manifest['last_updated'] ) ? (string) $manifest['last_updated'] : '',
			'download_link' => vm_booking_package_url( $manifest ),
			'sections'      => array(
				'description' => esc_html__( 'Pirties, keturračių, namelių, renginių ir kuponų rezervacijos iš Vanduo Marse sistemos.', 'vanduo-marse-booking' ),
			),
		);
	},
	10,
	3
);

/** Fresh check after an update and when someone presses "Check again" on Dashboard → Updates. */
add_action(
	'upgrader_process_complete',
	function () {
		delete_transient( VM_BOOKING_MANIFEST_CACHE );
	}
);
add_action(
	'load-update-core.php',
	function () {
		if ( isset( $_GET['force-check'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification -- read-only cache bust.
			delete_transient( VM_BOOKING_MANIFEST_CACHE );
		}
	}
);
