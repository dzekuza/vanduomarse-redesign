<?php
/**
 * Widget appearance: colours and fonts chosen under Rezervacijų sistema (top-level admin menu).
 * Stored as one option and sent to the app as query params on the iframe URL;
 * the app validates them again (lib/embed-theme.ts) and applies them as tokens.
 * Empty = the live Vanduo Marse look.
 */

defined( 'ABSPATH' ) || exit;

define( 'VM_BOOKING_APPEARANCE_OPTION', 'vm_booking_appearance' );

/** Colour settings: key (= query param) => [label, help, default shown in the picker]. */
function vm_booking_color_fields() {
	return array(
		'bg'         => array( __( 'Fonas', 'vanduo-marse-booking' ), __( 'Puslapio fonas už formos.', 'vanduo-marse-booking' ), '#f1d8ce' ),
		'surface'    => array( __( 'Turinio fonas', 'vanduo-marse-booking' ), __( 'Formos kortelė, laukeliai.', 'vanduo-marse-booking' ), '#fbf3ef' ),
		'muted'      => array( __( 'Suvestinės fonas', 'vanduo-marse-booking' ), __( 'Juosta su kaina ir mygtuku formos apačioje, užvedus ant skirtuko.', 'vanduo-marse-booking' ), '#f7e7e0' ),
		'text'       => array( __( 'Tekstas ir rėmeliai', 'vanduo-marse-booking' ), __( 'Tekstas, rėmeliai, pasirinkti laukeliai, pagrindinis mygtukas.', 'vanduo-marse-booking' ), '#382e38' ),
		'accent'     => array( __( 'Akcentas', 'vanduo-marse-booking' ), __( 'Žingsnių numeriai, ženkliukai, klaidos.', 'vanduo-marse-booking' ), '#ed5257' ),
		'tab'        => array( __( 'Skirtuko fonas', 'vanduo-marse-booking' ), __( 'Neaktyvus skirtukas.', 'vanduo-marse-booking' ), '#f1d8ce' ),
		'tab_active' => array( __( 'Aktyvaus skirtuko fonas', 'vanduo-marse-booking' ), '', '#382e38' ),
		'tab_text'   => array( __( 'Aktyvaus skirtuko tekstas', 'vanduo-marse-booking' ), '', '#fbf3ef' ),
	);
}

/** Popular Google Fonts offered in the font fields (any Google Fonts family name works). */
function vm_booking_font_suggestions() {
	return array( 'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Raleway', 'Nunito', 'Work Sans', 'DM Sans', 'Manrope', 'Rubik', 'Playfair Display', 'Merriweather', 'Oswald', 'Bebas Neue', 'Archivo' );
}

function vm_booking_appearance() {
	$saved = get_option( VM_BOOKING_APPEARANCE_OPTION, array() );
	return is_array( $saved ) ? $saved : array();
}

/** Same rule as the app: letters, digits, spaces. */
function vm_booking_sanitize_font( $value ) {
	if ( ! is_string( $value ) ) {
		return '';
	}
	$value = trim( preg_replace( '/\s+/', ' ', $value ) );
	return preg_match( '/^[A-Za-z0-9 ]{1,40}$/', $value ) ? $value : '';
}

function vm_booking_sanitize_appearance( $input ) {
	$input = is_array( $input ) ? $input : array();
	$clean = array();
	foreach ( array_keys( vm_booking_color_fields() ) as $key ) {
		// Arrays (e.g. a crafted bg[]=…) would make sanitize_hex_color() throw on PHP 8.
		$hex = isset( $input[ $key ] ) && is_string( $input[ $key ] ) ? sanitize_hex_color( $input[ $key ] ) : '';
		if ( $hex ) {
			$clean[ $key ] = $hex;
		}
	}
	foreach ( array( 'font', 'heading' ) as $key ) {
		$font = vm_booking_sanitize_font( isset( $input[ $key ] ) ? $input[ $key ] : '' );
		if ( '' !== $font ) {
			$clean[ $key ] = $font;
		}
	}
	if ( isset( $input['heading_case'] ) && is_string( $input['heading_case'] ) && in_array( $input['heading_case'], array( 'upper', 'none' ), true ) ) {
		$clean['heading_case'] = $input['heading_case'];
	}
	return $clean;
}

/** Saved appearance as iframe query args (hex without '#'). */
function vm_booking_appearance_args() {
	$args = array();
	foreach ( vm_booking_appearance() as $key => $value ) {
		$args[ $key ] = ltrim( $value, '#' );
	}
	return $args;
}

add_action(
	'admin_init',
	function () {
		register_setting(
			'vm_booking',
			VM_BOOKING_APPEARANCE_OPTION,
			array(
				'type'              => 'array',
				'default'           => array(),
				'sanitize_callback' => 'vm_booking_sanitize_appearance',
			)
		);
	}
);

/** Colour pickers and the live preview on the settings page only. */
add_action(
	'admin_enqueue_scripts',
	function ( $hook ) {
		if ( 'toplevel_page_vm-booking' !== $hook ) {
			return;
		}
		wp_enqueue_style( 'wp-color-picker' );
		wp_enqueue_script( 'vm-booking-admin', VM_BOOKING_URL . 'assets/admin.js', array( 'wp-color-picker' ), VM_BOOKING_VERSION, true );
		wp_enqueue_style( 'vm-booking' );
		wp_enqueue_script( 'vm-booking' );
	}
);

/** Rows for the appearance table on the settings page. */
function vm_booking_appearance_rows() {
	$saved = vm_booking_appearance();
	$name  = VM_BOOKING_APPEARANCE_OPTION;

	foreach ( vm_booking_color_fields() as $key => $field ) {
		list( $label, $help, $default ) = $field;
		$id = 'vm-booking-' . $key;
		?>
		<tr>
			<th scope="row"><label for="<?php echo esc_attr( $id ); ?>"><?php echo esc_html( $label ); ?></label></th>
			<td>
				<input type="text" id="<?php echo esc_attr( $id ); ?>" class="vm-booking-color" name="<?php echo esc_attr( $name . '[' . $key . ']' ); ?>" value="<?php echo esc_attr( isset( $saved[ $key ] ) ? $saved[ $key ] : '' ); ?>" data-default-color="<?php echo esc_attr( $default ); ?>" />
				<?php if ( $help ) : ?>
					<p class="description"><?php echo esc_html( $help ); ?></p>
				<?php endif; ?>
			</td>
		</tr>
		<?php
	}

	$fonts = array(
		'font'    => array( __( 'Teksto šriftas', 'vanduo-marse-booking' ), __( 'Google Fonts pavadinimas, pvz. Inter. Tuščias = Termina.', 'vanduo-marse-booking' ) ),
		'heading' => array( __( 'Antraščių šriftas', 'vanduo-marse-booking' ), __( 'Antraštės, skaičiai, datos. Tuščias = Termina.', 'vanduo-marse-booking' ) ),
	);
	foreach ( $fonts as $key => $field ) {
		$id = 'vm-booking-' . $key;
		?>
		<tr>
			<th scope="row"><label for="<?php echo esc_attr( $id ); ?>"><?php echo esc_html( $field[0] ); ?></label></th>
			<td>
				<input type="text" id="<?php echo esc_attr( $id ); ?>" class="regular-text" list="vm-booking-fonts" name="<?php echo esc_attr( $name . '[' . $key . ']' ); ?>" value="<?php echo esc_attr( isset( $saved[ $key ] ) ? $saved[ $key ] : '' ); ?>" placeholder="Termina" />
				<p class="description"><?php echo esc_html( $field[1] ); ?></p>
			</td>
		</tr>
		<?php
	}
	$case = isset( $saved['heading_case'] ) ? $saved['heading_case'] : '';
	?>
	<tr>
		<th scope="row"><label for="vm-booking-heading-case"><?php esc_html_e( 'Antraščių raidės', 'vanduo-marse-booking' ); ?></label></th>
		<td>
			<select id="vm-booking-heading-case" name="<?php echo esc_attr( $name . '[heading_case]' ); ?>">
				<option value="" <?php selected( $case, '' ); ?>><?php esc_html_e( 'Numatytosios (DIDŽIOSIOS)', 'vanduo-marse-booking' ); ?></option>
				<option value="upper" <?php selected( $case, 'upper' ); ?>><?php esc_html_e( 'DIDŽIOSIOS', 'vanduo-marse-booking' ); ?></option>
				<option value="none" <?php selected( $case, 'none' ); ?>><?php esc_html_e( 'Kaip parašyta', 'vanduo-marse-booking' ); ?></option>
			</select>
		</td>
	</tr>
	<datalist id="vm-booking-fonts">
		<?php foreach ( vm_booking_font_suggestions() as $font ) : ?>
			<option value="<?php echo esc_attr( $font ); ?>"></option>
		<?php endforeach; ?>
	</datalist>
	<?php
}
