// static/animation.js

document.addEventListener("DOMContentLoaded", () => {
  const animationContainer = document.querySelector(".baloes-animados");
  if (!animationContainer) return; // Para o script se o container não existir

  const balloonImages = [
    "static/fundo_balao1.png",
    "static/fundo_balao2.png",
    "static/fundo_balao3.png",
    "static/fundo_balao4.png",
  ];

  // 🔴 IMPORTANTE: Você precisa criar esta imagem!
  // Crie um confete pequeno (ex: 20x20px) e salve como confete.png
  const confeteImage = "static/confete.png";

  function createParticle(type) {
    const particle = document.createElement("img");
    particle.classList.add(type); // 'balao' ou 'confete'

    if (type === "balao") {
      const randomImage =
        balloonImages[Math.floor(Math.random() * balloonImages.length)];
      particle.src = randomImage;
      particle.style.width = `${Math.random() * 80 + 40}px`; // Balões de 40 a 120px
      particle.style.opacity = Math.random() * 0.5 + 0.5;
    } else {
      // type === 'confete'
      particle.src = confeteImage;
      particle.style.width = `${Math.random() * 15 + 10}px`; // Confetes de 10 a 25px
      particle.style.opacity = Math.random() * 0.7 + 0.3;
      // Faz os confetes terem cores diferentes (se a imagem base for branca/cinza)
      particle.style.filter = `hue-rotate(${Math.random() * 360}deg)`;
    }

    particle.style.left = `${Math.random() * 100}%`; // Posição horizontal aleatória

    // --- MUDANÇA NA VELOCIDADE ---
    // Duração entre 10 e 18 segundos (mais rápido que antes)
    particle.style.animationDuration = `${Math.random() * 8 + 10}s`;

    particle.style.animationDelay = `${Math.random() * -10}s`;

    animationContainer.appendChild(particle);

    particle.addEventListener("animationend", () => {
      particle.remove();
    });
  }

  // --- MUDANÇA NA FREQUÊNCIA ---

  // Gera um balão a cada 700ms (0.7 segundos) - (Antes era 1000ms)
  setInterval(() => createParticle("balao"), 700);

  // Gera um confete a cada 100ms (0.1 segundos) - (Antes era 300ms)
  setInterval(() => createParticle("confete"), 100);
});
