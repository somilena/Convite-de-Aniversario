// static/script.js (VERSÃO FINAL PARA O FLASK)

document.addEventListener('DOMContentLoaded', () => {

    // --- Referências dos Elementos ---
    const rsvpForm = document.getElementById('rsvp-form');
    const successMessage = document.getElementById('success-message');
    const florkForm = document.querySelector('.flork-container-form');

    // 💥 ADICIONE A REFERÊNCIA AO NOVO BOTÃO 💥
    const confirmarOutroBtn = document.getElementById('confirmar-outro-btn');

    // API Endpoints (caminhos do Flask)
    const formApiEndpoint = '/api/confirmar';
    const listaApiEndpoint = '/api/confirmados';
    const contadorElemento = document.getElementById('contador-numero');

    // --- CÓDIGO FINAL (PARA O FLASK) ---
    async function handleFormSubmit(event) {
        event.preventDefault();

        const nome = document.getElementById('nome').value;
        const participacao = document.getElementById('participacao').value;
        const statusMessage = document.getElementById('mensagem-status');

        if (!nome || !participacao) {
            statusMessage.textContent = 'Por favor, preencha todos os campos.';
            statusMessage.style.color = '#f44336';
            return;
        }

        try {
            // Envia os dados para o app.py
            const response = await fetch(formApiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, participacao })
            });

            const result = await response.json();

            if (response.ok) {
                // SUCESSO!
                rsvpForm.style.display = 'none';
                if (florkForm) florkForm.style.display = 'none';
                if (successMessage) successMessage.style.display = 'block';

                // Atualiza o contador de confirmados
                atualizarContador();

            } else {
                // Erro do servidor
                statusMessage.textContent = result.message || 'Erro ao enviar.';
                statusMessage.style.color = '#f44336';
            }
        } catch (error) {
            // Erro de rede
            statusMessage.textContent = 'Erro de conexão. Tente novamente.';
            statusMessage.style.color = '#f44336';
        }
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

    // Ativa o formulário real
    if (rsvpForm) {
        rsvpForm.addEventListener('submit', handleFormSubmit);
    }

    // --- FUNÇÕES DO MODAL E CONTADOR ---
    const verListaBtn = document.getElementById('ver-lista-btn');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalListaNomes = document.getElementById('modal-lista-nomes');

    // Função para carregar os nomes no Modal
    async function carregarNomesModal() {
        try {
            const response = await fetch(listaApiEndpoint); // Chama o app.py
            const nomes = await response.json();

            modalListaNomes.innerHTML = ''; // Limpa a lista de exemplos

            if (nomes.length === 0) {
                modalListaNomes.innerHTML = '<p>Ninguém confirmou ainda...</p>';
                return;
            }

            nomes.forEach(nome => {
                const p = document.createElement('p');
                p.textContent = nome;
                modalListaNomes.appendChild(p);
            });

        } catch (error) {
            modalListaNomes.innerHTML = '<p>Erro ao carregar a lista.</p>';
        }
    }

    // Função para atualizar o contador
    async function atualizarContador() {
        if (!contadorElemento) return;
        try {
            const response = await fetch(listaApiEndpoint);
            const nomes = await response.json();
            contadorElemento.textContent = nomes.length; // Atualiza o número
        } catch (error) {
            contadorElemento.textContent = '?';
        }
    }

    // --- Gatilhos dos Botões do Modal ---

    // Abre o Modal e carrega os nomes
    if (verListaBtn) {
        verListaBtn.addEventListener('click', () => {
            modalOverlay.classList.remove('hidden');
            carregarNomesModal(); // Carrega a lista real
        });
    }
    // Fecha o Modal (pelo 'X')
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', () => {
            modalOverlay.classList.add('hidden');
        });
    }
    // Fecha o Modal (clicando fora)
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (event) => {
            if (event.target === modalOverlay) {
                modalOverlay.classList.add('hidden');
            }
        });
    }

    // --- CONFEITES AO PASSAR O MOUSE ---
    const pessoaCards = document.querySelectorAll('.pessoa-card');
    pessoaCards.forEach(card => {
        const foto = card.querySelector('.foto-redonda-nova');
        if (foto) {
            foto.addEventListener('mouseenter', (event) => {
                event.stopPropagation();
                const isHeloise = card.querySelector('.heloise-chapeu');
                foto.style.borderColor = isHeloise ? 'var(--cor-balao-rosa)' : 'var(--cor-balao-azul)';

                const rect = foto.getBoundingClientRect();
                const burstX = rect.left + (rect.width / 2);
                const burstY = rect.top + (rect.height / 2);
                createConfettiBurst(burstX, burstY);
            });
            foto.addEventListener('mouseleave', (event) => {
                foto.style.borderColor = 'white';
            });
        }
    });

    // Função de criar confetes (exatamente como você tinha)
    function createConfettiBurst(x, y) {
        const burstContainer = document.createElement('div');
        burstContainer.className = 'confetti-burst';
        burstContainer.style.left = `${x}px`;
        burstContainer.style.top = `${y}px`;
        document.body.appendChild(burstContainer);
        const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722', '#795548', '#9e9e9e', '#607d8b'];
        for (let i = 0; i < 30; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 80 + 30;
            confetti.style.setProperty('--confetti-end-x', `${Math.cos(angle) * distance}px`);
            confetti.style.setProperty('--confetti-end-y', `${Math.sin(angle) * distance}px`);
            burstContainer.appendChild(confetti);
        }
        burstContainer.addEventListener('animationend', () => {
            burstContainer.remove();
        });
    }

    // --- LÓGICA DO PLAYER DE MÚSICA ---
    const musicaFundo = document.getElementById('musica-fundo');
    const controleBtn = document.getElementById('controle-musica-btn');
    if (musicaFundo && controleBtn) {
        let isPlaying = false;
        controleBtn.addEventListener('click', () => {
            if (isPlaying) {
                musicaFundo.pause();
                controleBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
                controleBtn.classList.remove('playing');
            } else {
                musicaFundo.play();
                controleBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
                controleBtn.classList.add('playing');
            }
            isPlaying = !isPlaying;
        });
        musicaFundo.volume = 0.1;
    }

    // --- ATUALIZA O CONTADOR QUANDO A PÁGINA CARREGA ---
    atualizarContador();

}); // Fim do DOMContentLoaded