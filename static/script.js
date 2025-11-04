// static/script.js (VERSÃO FINAL UNIFICADA E CORRIGIDA)

document.addEventListener("DOMContentLoaded", () => {
  // --- 1. LÓGICA DO FORMULÁRIO (E SUCESSO) ---
  const rsvpForm = document.getElementById("rsvp-form");
  const successMessage = document.getElementById("success-message");
  const florkForm = document.querySelector(".flork-container-form");
  const statusMessage = document.getElementById("mensagem-status");
  const formApiEndpoint = "/api/confirmar"; // Endpoint do Flask
  const listaApiEndpoint = "/api/confirmados"; // Endpoint do Flask
  const contadorElemento = document.getElementById("contador-numero");

  async function handleFormSubmit(event) {
    event.preventDefault();
    const nome = document.getElementById("nome").value.trim();
    const participacao = document.getElementById("participacao").value;

    if (!nome || !participacao) {
      statusMessage.textContent = "Por favor, preencha todos os campos.";
      statusMessage.style.color = "#f44336";
      return;
    }

    try {
      statusMessage.textContent = "Enviando...";
      statusMessage.style.color = "#00bcd4";

      const response = await fetch(formApiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, participacao }),
      });
      const result = await response.json();

      if (response.ok) {
        rsvpForm.style.display = "none";
        if (florkForm) florkForm.style.display = "none";
        if (successMessage) successMessage.style.display = "block";
        atualizarContador();
      } else {
        statusMessage.textContent = result.message || "Erro ao enviar.";
        statusMessage.style.color = "#f44336";
      }
    } catch (error) {
      statusMessage.textContent = "Erro de conexão. Tente novamente.";
      statusMessage.style.color = "#f44336";
    }
  }
  // Ativa o formulário real (se ele existir)
  if (rsvpForm) {
    rsvpForm.addEventListener("submit", handleFormSubmit);
  }

  // --- 2. LÓGICA DO MODAL (LISTA DE CONFIRMADOS) ---
  const verListaBtn = document.getElementById("ver-lista-btn");
  const modalOverlay = document.getElementById("modal-overlay");
  const modalCloseBtn = document.getElementById("modal-close-btn");
  const modalListaNomes = document.getElementById("modal-lista-nomes");

  async function carregarNomesModal() {
    if (!modalListaNomes) return;
    modalListaNomes.innerHTML = "<p>Carregando...</p>";
    try {
      const response = await fetch(listaApiEndpoint);
      const nomes = await response.json();
      modalListaNomes.innerHTML = "";
      if (nomes.length === 0) {
        modalListaNomes.innerHTML = "<p>Ninguém confirmou ainda...</p>";
        return;
      }
      nomes.forEach((nome) => {
        const p = document.createElement("p");
        p.textContent = nome;
        modalListaNomes.appendChild(p);
      });
    } catch (error) {
      modalListaNomes.innerHTML = "<p>Erro ao carregar a lista.</p>";
    }
  }

  async function atualizarContador() {
    if (!contadorElemento) return;
    try {
      const response = await fetch(listaApiEndpoint);
      const nomes = await response.json();
      contadorElemento.textContent = nomes.length;
    } catch (error) {
      contadorElemento.textContent = "?";
    }
  }

  if (verListaBtn) {
    verListaBtn.addEventListener("click", () => {
      modalOverlay.classList.remove("hidden");
      carregarNomesModal();
    });
  }
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener("click", () =>
      modalOverlay.classList.add("hidden")
    );
  }
  if (modalOverlay) {
    modalOverlay.addEventListener("click", (event) => {
      if (event.target === modalOverlay) modalOverlay.classList.add("hidden");
    });
  }

  // --- 3. LÓGICA DOS CONFEITES AO PASSAR O MOUSE (HOVER) ---
  const pessoaCards = document.querySelectorAll(".pessoa-card");
  pessoaCards.forEach((card) => {
    const foto = card.querySelector(".foto-redonda-nova");
    if (foto) {
      foto.addEventListener("mouseenter", (event) => {
        event.stopPropagation();
        const isHeloise = card.querySelector(".heloise-chapeu");
        foto.style.borderColor = isHeloise
          ? "var(--cor-balao-rosa)"
          : "var(--cor-balao-azul)";
        const rect = foto.getBoundingClientRect();
        const burstX = rect.left + rect.width / 2;
        const burstY = rect.top + rect.height / 2;
        createConfettiBurst(burstX, burstY);
      });
      foto.addEventListener("mouseleave", (event) => {
        foto.style.borderColor = "white";
      });
    }
  });

  function createConfettiBurst(x, y) {
    const burstContainer = document.createElement("div");
    burstContainer.className = "confetti-burst";
    burstContainer.style.left = `${x}px`;
    burstContainer.style.top = `${y}px`;
    document.body.appendChild(burstContainer);
    const colors = [
      "#f44336",
      "#e91e63",
      "#9c27b0",
      "#673ab7",
      "#3f51b5",
      "#2196f3",
      "#03a9f4",
      "#00bcd4",
      "#009688",
      "#4caf50",
      "#8bc34a",
      "#cddc39",
      "#ffeb3b",
      "#ffc107",
      "#ff9800",
      "#ff5722",
      "#795548",
      "#9e9e9e",
      "#607d8b",
    ];

    for (let i = 0; i < 15; i++) {
      // Otimizado para 15 confetes
      const confetti = document.createElement("div");
      confetti.className = "confetti";
      confetti.style.backgroundColor =
        colors[Math.floor(Math.random() * colors.length)];
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 80 + 30;
      confetti.style.setProperty(
        "--confetti-end-x",
        `${Math.cos(angle) * distance}px`
      );
      confetti.style.setProperty(
        "--confetti-end-y",
        `${Math.sin(angle) * distance}px`
      );
      burstContainer.appendChild(confetti);
    }
    burstContainer.addEventListener("animationend", () =>
      burstContainer.remove()
    );
  }

  // --- 4. LÓGICA DO PLAYER DE MÚSICA ---
  const musicaFundo = document.getElementById("musica-fundo");
  const controleBtn = document.getElementById("controle-musica-btn");
  if (musicaFundo && controleBtn) {
    let isPlaying = false;
    controleBtn.addEventListener("click", () => {
      if (isPlaying) {
        musicaFundo.pause();
        controleBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        controleBtn.classList.remove("playing");
      } else {
        musicaFundo.play();
        controleBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        controleBtn.classList.add("playing");
      }
      isPlaying = !isPlaying;
    });
    musicaFundo.volume = 0.3;
  }

  // --- 5. LÓGICA DOS BALÕES DE FUNDO (DO 'animation.js') ---
  const animationContainer = document.querySelector(".baloes-animados");
  if (!animationContainer) return;

  const balloonImages = [
    "static/fundo_balao1.png",
    "static/fundo_balao2.png",
    "static/fundo_balao3.png",
    "static/fundo_balao4.png",
  ];
  // Usa a sua imagem de confete!
  const confeteImage = "static/confete.png";

  function createParticle(type) {
    if (!document.body.contains(animationContainer)) return;

    const particle = document.createElement("img");
    particle.classList.add(type);

    if (type === "balao") {
      const randomImage =
        balloonImages[Math.floor(Math.random() * balloonImages.length)];
      particle.src = randomImage;
      particle.style.width = `${Math.random() * 80 + 100}px`; // Tamanho otimizado
      particle.style.opacity = Math.random() * 0.5 + 0.4; // Um pouco mais visível
    } else {
      // type === 'confete'
      particle.src = confeteImage;
      particle.style.width = `${Math.random() * 15 + 10}px`;
      particle.style.opacity = Math.random() * 0.7 + 0.3;
      particle.style.filter = `hue-rotate(${Math.random() * 360}deg)`; // Muda a cor da imagem
    }
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.animationDuration = `${Math.random() * 20 + 25}s`; // Velocidade (Lenta)
    particle.style.animationDelay = `${Math.random() * -10}s`;
    animationContainer.appendChild(particle);
    particle.addEventListener("animationend", () => particle.remove());
  }

  // Otimizado para menos "engasgo"
  setInterval(() => createParticle("balao"), 5000); // 1 balão a cada 5 segundos
  setInterval(() => createParticle("confete"), 1500); // 1 confete a cada 1.5 segundos
  for (let i = 0; i < 2; i++) createParticle("balao"); // Menos no início
  for (let i = 0; i < 10; i++) createParticle("confete"); // Menos no início

  // --- FIM DO DOMContentLoaded ---
  atualizarContador();
});
