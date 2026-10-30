<?php
/**
 * Plugin Name:       Vanduo Marse rezervacijos
 * Description:       Pirties, keturračių, namelių, renginių ir kuponų rezervacijos iš Vanduo Marse sistemos: trumpasis kodas [vm_booking], Gutenberg blokas ir valdiklis.
 * Version:           1.1.0
 * Requires at least: 6.1
 * Requires PHP:      7.4
 * Author:            Vanduo Marse
 * License:           GPL-2.0-or-later
 * Text Domain:       vanduo-marse-booking
 *
 * The booking flows stay in the Next.js app: this plugin only frames its
 * /embed/* pages and resizes the iframe to fit. Prices, availability and
 * submissions all go through the app, so WordPress never needs updating
 * when rates change.
 */

defined( 'ABSPATH' ) || exit;

define( 'VM_BOOKING_VERSION', '1.1.0' );
define( 'VM_BOOKING_OPTION', 'vm_booking_app_url' );
/** Production booking app; Settings → Vanduo Marse overrides it (e.g. a custom domain). */
define( 'VM_BOOKING_DEFAULT_URL', 'https://vanduomarse-redesign.vercel.app' );
define( 'VM_BOOKING_URL', plugin_dir_url( __FILE__ ) );
define( 'VM_BOOKING_DIR', plugin_dir_path( __FILE__ ) );

require_once VM_BOOKING_DIR . 'includes/settings.php';
require_once VM_BOOKING_DIR . 'includes/widget.php';

/** Widget type => [iframe title, allowed `tab` values]. Mirrors the app's /embed routes. */
function vm_booking_widgets() {
	return array(
		'pirtis'      => array( __( 'Pirties rezervacija', 'vanduo-marse-booking' ), array( 'renginiai' ) ),
		'keturraciai' => array( __( 'Keturračių nuoma', 'vanduo-marse-booking' ), array( 'zygiai' ) ),
		'miegas'      => array( __( 'Namelių rezervacija', 'vanduo-marse-booking' ), array() ),
		'renginiai'   => array( __( 'Renginiai Marse', 'vanduo-marse-booking' ), array() ),
		'kuponai'     => array( __( 'Dovanų kuponai', 'vanduo-marse-booking' ), array() ),
	);
}

/** App origin (scheme + host + port) from the saved URL (default: production), or '' when invalid. */
function vm_booking_app_origin() {
	$saved = (string) get_option( VM_BOOKING_OPTION, '' );
	$parts = wp_parse_url( '' !== $saved ? $saved : VM_BOOKING_DEFAULT_URL );
	if ( empty( $parts['scheme'] ) || empty( $parts['host'] ) ) {
		return '';
	}
	$port = isset( $parts['port'] ) ? ':' . $parts['port'] : '';
	return $parts['scheme'] . '://' . $parts['host'] . $port;
}

/**
 * The iframe markup for one widget, in a full-width wrapper so it takes the
 * width of whatever block, column or sidebar it sits in (the embed reflows to
 * that width, embed.js sets the height). Unknown types render nothing; unknown
 * tabs fall back to the default tab. `$wrapper_attributes` lets the block pass
 * get_block_wrapper_attributes() (alignment, spacing, custom class).
 */
function vm_booking_render( $type, $tab = '', $wrapper_attributes = 'class="vm-booking"' ) {
	$widgets = vm_booking_widgets();
	$origin  = vm_booking_app_origin();
	if ( ! isset( $widgets[ $type ] ) ) {
		return '';
	}
	if ( '' === $origin ) {
		return current_user_can( 'manage_options' )
			? '<p class="vm-booking-notice">' . esc_html__( 'Vanduo Marse rezervacijos: nustatykite sistemos adresą Nustatymai → Vanduo Marse.', 'vanduo-marse-booking' ) . '</p>'
			: '';
	}

	list( $title, $tabs ) = $widgets[ $type ];
	$src = $origin . '/embed/' . $type;
	if ( in_array( $tab, $tabs, true ) ) {
		$src = add_query_arg( 'skirtukas', $tab, $src );
	}

	wp_enqueue_style( 'vm-booking' );
	wp_enqueue_script( 'vm-booking' );

	return sprintf(
		'<div %1$s><iframe class="vm-booking-frame" src="%2$s" title="%3$s" data-vm-origin="%4$s" loading="lazy" allow="clipboard-write"></iframe></div>',
		$wrapper_attributes, // Escaped by the caller (fixed string or get_block_wrapper_attributes()).
		esc_url( $src ),
		esc_attr( $title ),
		esc_attr( $origin )
	);
}

/** [vm_booking type="pirtis" tab="renginiai"] */
add_shortcode(
	'vm_booking',
	function ( $atts ) {
		$atts = shortcode_atts(
			array(
				'type' => 'pirtis',
				'tab'  => '',
			),
			$atts,
			'vm_booking'
		);
		return vm_booking_render( sanitize_key( $atts['type'] ), sanitize_key( $atts['tab'] ) );
	}
);

/**
 * Assets are registered on init (not wp_enqueue_scripts): block themes render
 * the template before wp_enqueue_scripts fires. The dynamic block's editor
 * picks type and tab; PHP renders the same iframe as the shortcode.
 */
add_action(
	'init',
	function () {
		wp_register_style( 'vm-booking', VM_BOOKING_URL . 'assets/embed.css', array(), VM_BOOKING_VERSION );
		wp_register_script( 'vm-booking', VM_BOOKING_URL . 'assets/embed.js', array(), VM_BOOKING_VERSION, true );
		wp_register_script(
			'vm-booking-block-editor',
			VM_BOOKING_URL . 'blocks/booking/editor.js',
			array( 'wp-blocks', 'wp-element', 'wp-components', 'wp-block-editor', 'wp-i18n' ),
			VM_BOOKING_VERSION,
			true
		);
		register_block_type(
			VM_BOOKING_DIR . 'blocks/booking',
			array(
				'render_callback' => function ( $attributes ) {
					$type = isset( $attributes['type'] ) ? sanitize_key( $attributes['type'] ) : 'pirtis';
					$tab  = isset( $attributes['tab'] ) ? sanitize_key( $attributes['tab'] ) : '';
					return vm_booking_render( $type, $tab, get_block_wrapper_attributes( array( 'class' => 'vm-booking' ) ) );
				},
			)
		);
	}
);
