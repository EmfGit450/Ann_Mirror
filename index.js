document.addEventListener("DOMContentLoaded", (event) => {
  gsap.registerPlugin(TextPlugin)

  gsap.to(".description", {
    text: { value: "A tool to create, train, infer, and inspect multi-layer perceptrons visually" },
    duration: 2.5,
    ease: "none"
  });

  gsap.fromTo(".main-links a", {
    opacity: 0,
    y: 30
  }, {
    opacity: 1,
    y: 0,
    stagger: 0.2,
    duration: 0.5,
    delay: 2.5,
    ease: "elastic.inOut"
  });



});