// static/script.js (VERSÃO FINAL OTIMIZADA - COM CORREÇÃO DE DELAY)

document.addEventListener("DOMContentLoaded", () => {
    // --- 1. LÓGICA DO FORMULÁRIO (E SUCESSO) ---
    const rsvpForm = document.getElementById("rsvp-form");
    const successMessage = document.getElementById("success-message");
    const florkForm = document.querySelector(".flork-container-form");
    const statusMessage = document.getElementById("mensagem-status");
    const formApiEndpoint = "/api/confirmar";
    const listaApiEndpoint = "/api/confirmados";
    const contadorElemento = document.getElementById("contador-numero");

    // 💥 ADICIONE A REFERÊNCIA AO NOVO BOTÃO 💥
    const confirmarOutroBtn = document.getElementById('confirmar-outro-btn');

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
    if (rsvpForm) {
        rsvpForm.addEventListener("submit", handleFormSubmit);
    }

    // 💥 ADICIONE O EVENTO DO NOVO BOTÃO 💥
    if (confirmarOutroBtn) {
        confirmarOutroBtn.addEventListener('click', () => {
            // Esconde a mensagem de sucesso
            if (successMessage) {
                successMessage.style.display = 'none';
            }

            // Mostra o formulário de novo
            if (rsvpForm) {
                rsvpForm.style.display = 'block';
            }

            // Mostra o Flork de novo
            if (florkForm) {
                florkForm.style.display = 'block';
            }
        });
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
        musicaFundo.volume = 0.1;
    }

    // --- 5. LÓGICA DOS BALÕES DE FUNDO (COM INTERAÇÃO DE CLIQUE) ---
    const animationContainer = document.querySelector(".baloes-animados");
    if (animationContainer) {

        const balloonImages = [
            'static/fundo_balao1.png',
            'static/fundo_balao2.png',
            'static/fundo_balao3.png',
            'static/fundo_balao4.png',
        ];
        const confeteImage = 'static/confete.png';

        // Nova função para criar explosão de confetes ao estourar
        function createPopConfettiBurst(x, y) {
            const burstContainer = document.createElement('div');
            burstContainer.className = 'confetti-burst-pop'; // Nova classe para diferenciar
            burstContainer.style.left = `${x}px`;
            burstContainer.style.top = `${y}px`;
            animationContainer.appendChild(burstContainer); // Adiciona ao container de animação

            const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722', '#795548', '#9e9e9e', '#607d8b'];

            for (let i = 0; i < 10; i++) { // Cria 10 confetes para a explosão
                const confetti = document.createElement('div');
                confetti.className = 'confetti'; // Usa a mesma classe de estilo para o confete
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * 50 + 20; // Menor explosão
                confetti.style.setProperty('--confetti-end-x', `${Math.cos(angle) * distance}px`);
                confetti.style.setProperty('--confetti-end-y', `${Math.sin(angle) * distance}px`);
                burstContainer.appendChild(confetti);
            }
            burstContainer.addEventListener('animationend', () => burstContainer.remove());
        }

        // Nova função para lidar com o clique/toque no balão
        function popBalloon(event) {
            const particle = event.target;

            // Impede que o clique se propague para elementos abaixo
            event.stopPropagation();
            event.preventDefault(); // Impede rolagem no celular, etc.

            // Obter a posição do balão para soltar confetes
            const rect = particle.getBoundingClientRect();
            const burstX = rect.left + (rect.width / 2);
            const burstY = rect.top + (rect.height / 2);
            createPopConfettiBurst(burstX, burstY);

            // Adiciona classe para animação de "estouro"
            particle.classList.add('popping');

            // Remove o balão depois da animação
            particle.addEventListener('animationend', () => {
                particle.remove();
            }, { once: true }); // Executa o listener apenas uma vez
        }

        function createParticle(type) {
            if (!document.body.contains(animationContainer)) return;

            const particle = document.createElement("img");
            particle.classList.add(type === "balao" ? "balao" : "confete");

            if (type === "balao") {
                const randomImage = balloonImages[Math.floor(Math.random() * balloonImages.length)];
                particle.src = randomImage;
                particle.style.width = `${Math.random() * 80 + 100}px`;
                particle.style.opacity = Math.random() * 0.5 + 0.4;

                // 💥 ADICIONA EVENTO DE CLIQUE APENAS PARA BALÕES 💥
                particle.addEventListener('click', popBalloon);
                particle.addEventListener('touchstart', popBalloon, { passive: false }); // Para toque em celular

            } else { // type === 'confete'
                particle.src = confeteImage;
                particle.style.width = `${Math.random() * 15 + 10}px`;
                particle.style.opacity = Math.random() * 0.7 + 0.3;
                particle.style.filter = `hue-rotate(${Math.random() * 360}deg)`;
            }

            particle.style.left = `${Math.random() * 100}%`;
            particle.style.animationDuration = `${Math.random() * 20 + 25}s`;
            particle.style.animationDelay = `-${Math.random() * 20}s`;

            animationContainer.appendChild(particle);
            // Remove o balão APENAS se ele chegar ao fim da animação normal (não estourado)
            particle.addEventListener("animationend", (e) => {
                if (!e.target.classList.contains('popping')) {
                    e.target.remove();
                }
            });
        }

        // Frequência
        setInterval(() => createParticle("balao"), 5000);
        setInterval(() => createParticle("confete"), 1500);

        // Partículas iniciais
        for (let i = 0; i < 8; i++) createParticle("balao");
        for (let i = 0; i < 25; i++) createParticle("confete");
    }

    // --- FIM DO DOMContentLoaded ---
    atualizarContador();
});
