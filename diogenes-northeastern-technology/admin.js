
"use strict";

const SENHA_DE_TESTE = "Nordeste@2026";

document.addEventListener("DOMContentLoaded", () => {
  const campoSenha = document.getElementById("senha");
  const botaoOlho = document.getElementById("mostrar-senha");
  const loginForm = document.getElementById("login-form");
  const loginMensagem = document.getElementById("login-mensagem");
  const anoAtual = document.getElementById("ano-atual");

  if (anoAtual) {
    anoAtual.textContent = new Date().getFullYear();
  }

  // Mostrar ou ocultar a senha.
  if (campoSenha && botaoOlho) {
    botaoOlho.addEventListener("click", () => {
      const mostrar = campoSenha.type === "password";

      campoSenha.type = mostrar ? "text" : "password";
      botaoOlho.setAttribute("aria-pressed", String(mostrar));
      botaoOlho.setAttribute(
        "aria-label",
        mostrar ? "Ocultar senha" : "Mostrar senha"
      );
      botaoOlho.title = mostrar ? "Ocultar senha" : "Mostrar senha";
    });
  }

  // Verificar o login.
  if (loginForm && campoSenha) {
    loginForm.addEventListener("submit", (evento) => {
      evento.preventDefault();

      if (campoSenha.value !== SENHA_DE_TESTE) {
        loginMensagem.textContent =
          "Senha incorreta. Confira o que digitou.";
        loginMensagem.classList.add("erro");
        campoSenha.focus();
        return;
      }

      loginMensagem.textContent = "Acesso autorizado!";
      loginMensagem.classList.remove("erro");

      window.location.href = "./publicacoes.html";
    });
  }
});
