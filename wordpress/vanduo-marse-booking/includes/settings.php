<?php
/**
 * Settings → Vanduo Marse: the address of the booking app (the Next.js site).
 */

defined( 'ABSPATH' ) || exit;

add_action(
	'admin_init',
	function () {
		register_setting(
			'vm_booking',
			VM_BOOKING_OPTION,
			array(
				'type'              => 'string',
				'default'           => '',
				'sanitize_callback' => function ( $value ) {
					$url = esc_url_raw( trim( (string) $value ), array( 'https', 'http' ) );
					return untrailingslashit( $url );
				},
			)
		);
	}
);

add_action(
	'admin_menu',
	function () {
		add_options_page(
			__( 'Vanduo Marse rezervacijos', 'vanduo-marse-booking' ),
			__( 'Vanduo Marse', 'vanduo-marse-booking' ),
			'manage_options',
			'vm-booking',
			'vm_booking_settings_page'
		);
	}
);

function vm_booking_settings_page() {
	?>
	<div class="wrap">
		<h1><?php esc_html_e( 'Vanduo Marse rezervacijos', 'vanduo-marse-booking' ); ?></h1>
		<form method="post" action="options.php">
			<?php settings_fields( 'vm_booking' ); ?>
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="vm-booking-url"><?php esc_html_e( 'Sistemos adresas', 'vanduo-marse-booking' ); ?></label></th>
					<td>
						<input type="url" id="vm-booking-url" class="regular-text" name="<?php echo esc_attr( VM_BOOKING_OPTION ); ?>" value="<?php echo esc_attr( get_option( VM_BOOKING_OPTION, '' ) ); ?>" placeholder="<?php echo esc_attr( VM_BOOKING_DEFAULT_URL ); ?>" />
						<p class="description">
							<?php
							printf(
								/* translators: %s: this site's origin */
								esc_html__( 'Rezervacijų sistemos (Next.js) adresas; tuščias = numatytasis. Sistemos aplinkos kintamajame EMBED_ALLOWED_ORIGINS turi būti šios svetainės adresas: %s', 'vanduo-marse-booking' ),
								'<code>' . esc_html( untrailingslashit( home_url() ) ) . '</code>'
							);
							?>
						</p>
					</td>
				</tr>
			</table>
			<?php submit_button(); ?>
		</form>
		<h2><?php esc_html_e( 'Naudojimas', 'vanduo-marse-booking' ); ?></h2>
		<p><?php esc_html_e( 'Blokas „Vanduo Marse rezervacija“ redaktoriuje, valdiklis Išvaizda → Valdikliai arba trumpasis kodas:', 'vanduo-marse-booking' ); ?></p>
		<p><code>[vm_booking type="pirtis"]</code> <code>[vm_booking type="pirtis" tab="renginiai"]</code> <code>[vm_booking type="keturraciai" tab="zygiai"]</code> <code>[vm_booking type="miegas"]</code> <code>[vm_booking type="renginiai"]</code> <code>[vm_booking type="kuponai"]</code></p>
	</div>
	<?php
}
