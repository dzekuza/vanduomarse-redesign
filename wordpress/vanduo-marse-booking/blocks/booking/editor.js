/**
 * Editor UI for the Vanduo Marse booking block. Plain wp.* globals, no build
 * step. The block is dynamic: PHP renders the iframe on the front end, the
 * editor shows a placeholder with the chosen service.
 */
(function (wp) {
  var el = wp.element.createElement;
  var __ = wp.i18n.__;
  var useBlockProps = wp.blockEditor.useBlockProps;
  var Placeholder = wp.components.Placeholder;
  var SelectControl = wp.components.SelectControl;

  var TYPES = [
    { value: "pirtis", label: __("Pirtis", "vanduo-marse-booking") },
    { value: "keturraciai", label: __("Keturračiai", "vanduo-marse-booking") },
    { value: "miegas", label: __("Nameliai", "vanduo-marse-booking") },
    { value: "renginiai", label: __("Renginiai", "vanduo-marse-booking") },
    { value: "kuponai", label: __("Dovanų kuponai", "vanduo-marse-booking") },
  ];

  /** Optional starting tab per service; mirrors vm_booking_widgets() in PHP. */
  var TABS = {
    pirtis: [
      { value: "", label: __("Privati rezervacija", "vanduo-marse-booking") },
      { value: "renginiai", label: __("Renginiai (bilietai)", "vanduo-marse-booking") },
    ],
    keturraciai: [
      { value: "", label: __("Nuoma valandomis", "vanduo-marse-booking") },
      { value: "zygiai", label: __("Žygiai su gidu", "vanduo-marse-booking") },
    ],
  };

  wp.blocks.registerBlockType("vanduo-marse/booking", {
    edit: function (props) {
      var type = props.attributes.type;
      var tabs = TABS[type];

      return el(
        "div",
        useBlockProps(),
        el(
          Placeholder,
          {
            icon: "calendar-alt",
            label: __("Vanduo Marse rezervacija", "vanduo-marse-booking"),
            instructions: __("Rezervacijos forma bus rodoma svetainėje.", "vanduo-marse-booking"),
          },
          el(SelectControl, {
            label: __("Paslauga", "vanduo-marse-booking"),
            value: type,
            options: TYPES,
            onChange: function (value) {
              props.setAttributes({ type: value, tab: "" });
            },
            __nextHasNoMarginBottom: true,
          }),
          tabs
            ? el(SelectControl, {
                label: __("Pradinis skirtukas", "vanduo-marse-booking"),
                value: props.attributes.tab,
                options: tabs,
                onChange: function (value) {
                  props.setAttributes({ tab: value });
                },
                __nextHasNoMarginBottom: true,
              })
            : null
        )
      );
    },
    save: function () {
      return null;
    },
  });
})(window.wp);
