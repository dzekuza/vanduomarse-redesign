<?php
/**
 * Classic widget (Appearance → Widgets) for themes without block widget areas.
 */

defined( 'ABSPATH' ) || exit;

class VM_Booking_Widget extends WP_Widget {

	public function __construct() {
		parent::__construct(
			'vm_booking_widget',
			__( 'Vanduo Marse rezervacija', 'vanduo-marse-booking' ),
			array( 'description' => __( 'Pirties, keturračių, namelių, renginių ar kuponų rezervacija.', 'vanduo-marse-booking' ) )
		);
	}

	public function widget( $args, $instance ) {
		$type = isset( $instance['type'] ) ? $instance['type'] : 'pirtis';
		$tab  = isset( $instance['tab'] ) ? $instance['tab'] : '';
		$html = vm_booking_render( $type, $tab );
		if ( '' === $html ) {
			return;
		}
		echo $args['before_widget']; // phpcs:ignore WordPress.Security.EscapeOutput -- theme markup.
		if ( ! empty( $instance['title'] ) ) {
			echo $args['before_title'] . esc_html( $instance['title'] ) . $args['after_title']; // phpcs:ignore WordPress.Security.EscapeOutput
		}
		echo $html; // phpcs:ignore WordPress.Security.EscapeOutput -- escaped in vm_booking_render().
		echo $args['after_widget']; // phpcs:ignore WordPress.Security.EscapeOutput
	}

	public function form( $instance ) {
		$title = isset( $instance['title'] ) ? $instance['title'] : '';
		$type  = isset( $instance['type'] ) ? $instance['type'] : 'pirtis';
		$tab   = isset( $instance['tab'] ) ? $instance['tab'] : '';
		?>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>"><?php esc_html_e( 'Antraštė', 'vanduo-marse-booking' ); ?></label>
			<input class="widefat" id="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'title' ) ); ?>" type="text" value="<?php echo esc_attr( $title ); ?>" />
		</p>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'type' ) ); ?>"><?php esc_html_e( 'Paslauga', 'vanduo-marse-booking' ); ?></label>
			<select class="widefat" id="<?php echo esc_attr( $this->get_field_id( 'type' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'type' ) ); ?>">
				<?php foreach ( vm_booking_widgets() as $key => $widget ) : ?>
					<option value="<?php echo esc_attr( $key ); ?>" <?php selected( $type, $key ); ?>><?php echo esc_html( $widget[0] ); ?></option>
				<?php endforeach; ?>
			</select>
		</p>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'tab' ) ); ?>"><?php esc_html_e( 'Skirtukas (nebūtina): renginiai arba zygiai', 'vanduo-marse-booking' ); ?></label>
			<input class="widefat" id="<?php echo esc_attr( $this->get_field_id( 'tab' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'tab' ) ); ?>" type="text" value="<?php echo esc_attr( $tab ); ?>" />
		</p>
		<?php
	}

	public function update( $new_instance, $old_instance ) {
		return array(
			'title' => sanitize_text_field( isset( $new_instance['title'] ) ? $new_instance['title'] : '' ),
			'type'  => sanitize_key( isset( $new_instance['type'] ) ? $new_instance['type'] : 'pirtis' ),
			'tab'   => sanitize_key( isset( $new_instance['tab'] ) ? $new_instance['tab'] : '' ),
		);
	}
}

add_action(
	'widgets_init',
	function () {
		register_widget( 'VM_Booking_Widget' );
	}
);
