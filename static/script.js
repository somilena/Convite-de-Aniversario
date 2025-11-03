document.addEventListener("DOMContentLoaded", () => {
  const rsvpForm = document.getElementById("rsvp-form");
  const statusMessage = document.getElementById("mensagem-status");
  const listaConfirmadosDiv = document.getElementById("lista-confirmados");

  // ==========================================================
  // Função de LEITURA: Busca a lista da API Flask
  // ==========================================================
  const carregarLista = async () => {
    listaConfirmadosDiv.innerHTML =
      '<p style="text-align: center; color: #999;">Carregando lista do servidor...</p>';

    try {
      // Chama o endpoint de API do Flask
      const response = await fetch("/api/confirmados");
      const confirmados = await response.json();

      if (!response.ok) {
        throw new Error(confirmados.message || "Erro desconhecido na API.");
      }

      listaConfirmadosDiv.innerHTML = "";

      if (confirmados.length === 0) {
        listaConfirmadosDiv.innerHTML =
          '<p style="text-align: center; color: #999;">Ninguém confirmou presença (SIM) ainda.</p>';
        return;
      }

      // Exibe a lista
      confirmados.forEach((nome) => {
        const p = document.createElement("p");
        // O status-sim será sempre 'VAI', pois a API filtra apenas o SIM
        p.innerHTML = `<span>${nome}</span><span class="status-sim">VAI</span>`;
        listaConfirmadosDiv.appendChild(p);
      });
    } catch (error) {
      console.error("Erro ao buscar lista:", error);
      listaConfirmadosDiv.innerHTML = `<p style="text-align: center; color: #f44336;">Erro ao carregar a lista. Recarregue a página.</p>`;
    }
  };

  // Carrega a lista ao iniciar
  carregarLista();

  // ==========================================================
  // Função de ESCRITA: Envia a confirmação para a API Flask
  // ==========================================================
  rsvpForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const participacao = document.getElementById("participacao").value;

    if (!nome || !participacao) {
      statusMessage.textContent = "Por favor, preencha todos os campos.";
      statusMessage.style.color = "#f44336";
      return;
    }

    const dadosEnvio = { nome, participacao };

    try {
      statusMessage.textContent = "Enviando confirmação...";
      statusMessage.style.color = "#00bcd4";

      const response = await fetch("/api/confirmar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosEnvio),
      });

      const resultado = await response.json();

      if (!response.ok) {
        throw new Error(resultado.message || "Erro no servidor.");
      }

      statusMessage.textContent = resultado.message;
      statusMessage.style.color = "#4CAF50";
      rsvpForm.reset();

      // Atualiza a lista imediatamente após o envio bem-sucedido
      carregarLista();
      setTimeout(() => (statusMessage.textContent = ""), 5000);
    } catch (error) {
      console.error("Erro no envio:", error);
      statusMessage.textContent = `Erro ao enviar confirmação: ${error.message}`;
      statusMessage.style.color = "#f44336";
    }
  });
});
