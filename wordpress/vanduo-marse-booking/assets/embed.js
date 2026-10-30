/**
 * Resizes Vanduo Marse booking iframes to their content height. The embed page
 * posts { type: "vm-embed:height", height } whenever its content changes size;
 * only messages from the configured app origin and from one of our iframes count.
 */
(function () {
  var MESSAGE = "vm-embed:height";

  /** Normalised origin of the configured app URL (drops default ports, lowercases host). */
  function originOf(value) {
    try {
      return new URL(value).origin;
    } catch (e) {
      return null;
    }
  }

  window.addEventListener("message", function (event) {
    var data = event.data;
    if (!data || data.type !== MESSAGE || typeof data.height !== "number") return;

    var frames = document.querySelectorAll("iframe.vm-booking-frame");
    for (var i = 0; i < frames.length; i++) {
      var frame = frames[i];
      if (frame.contentWindow !== event.source || originOf(frame.getAttribute("data-vm-origin")) !== event.origin) continue;

      var previous = frame.offsetHeight;
      var next = Math.max(0, Math.ceil(data.height));
      frame.style.minHeight = "0";
      frame.style.height = next + "px";

      // A step that shrinks a lot (e.g. the confirmation) can leave the visitor
      // below the widget: bring its top back into view.
      var top = frame.getBoundingClientRect().top;
      if (previous - next > 200 && top < 0) {
        frame.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  });
})();
