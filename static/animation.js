document.addEventListener("DOMContentLoaded", () => {
  const baloesAnimadosContainer = document.querySelector(".baloes-animados");
  if (!baloesAnimadosContainer) return;

  const baloesFlork = [
    "static/fundo_balao1.png",
    "static/fundo_balao2.png",
    "static/fundo_balao3.png",
    "static/fundo_balao4.png",
  ];
  const confetesConfig = [
    { color: "#ffc0cb" },
    { color: "#87ceeb" },
    { color: "#fafad2" },
    { color: "#98fb98" },
    { color: "#ff69b4" },
  ];

  function createBalaoFlork() {
    if (!document.body.contains(baloesAnimadosContainer)) return;
    const balao = document.createElement("img");
    balao.className = "balao";
    const randomBalaoImage =
      baloesFlork[Math.floor(Math.random() * baloesFlork.length)];
    balao.src = randomBalaoImage;
    balao.style.width = `${Math.random() * 80 + 100}px`; // Tamanho um pouco menor
    balao.style.left = `${Math.random() * 100}%`;
    balao.style.animationDelay = `${Math.random() * 10}s`;
    balao.style.animationDuration = `${Math.random() * 20 + 25}s`;
    baloesAnimadosContainer.appendChild(balao);
    balao.addEventListener("animationend", () => balao.remove());
  }

  function createConfete() {
    if (!document.body.contains(baloesAnimadosContainer)) return;
    const confeteData =
      confetesConfig[Math.floor(Math.random() * confetesConfig.length)];
    const confete = document.createElement("div");
    confete.className = "confete";
    confete.style.backgroundColor = confeteData.color;
    const size = `${Math.random() * 8 + 4}px`; // Tamanho menor
    confete.style.width = size;
    confete.style.height = size;
    confete.style.borderRadius = "50%";
    confete.style.left = `${Math.random() * 100}%`;
    confete.style.animationDelay = `${Math.random() * 8}s`;
    confete.style.animationDuration = `${Math.random() * 15 + 15}s`;
    baloesAnimadosContainer.appendChild(confete);
    confete.addEventListener("animationend", () => confete.remove());
  }

  // --- MUDANÇA (MENOS FREQUÊNCIA) ---
  setInterval(createBalaoFlork, 5000); // Antes: 2500ms. Agora: 1 balão a cada 5 segundos
  setInterval(createConfete, 1500); // Antes: 500ms. Agora: 1 confete a cada 1.5 segundos

  // --- MUDANÇA (MENOS NO INÍCIO) ---
  for (let i = 0; i < 2; i++) createBalaoFlork(); // Antes: 5
  for (let i = 0; i < 10; i++) createConfete(); // Antes: 20
});
