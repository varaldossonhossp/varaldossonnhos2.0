// componentes/componentes.js
document.addEventListener("DOMContentLoaded", async () => {
  // HEADER
  const headerContainer = document.createElement("div");
  headerContainer.id = "header-container";
  document.body.prepend(headerContainer);

  try {
    const headerResp = await fetch("componentes/header.html");
    const headerHTML = await headerResp.text();
    headerContainer.innerHTML = headerHTML;
  } catch (erro) {
    console.error("Erro ao carregar o cabeçalho:", erro);
  }

  // FOOTER
  const footerContainer = document.createElement("div");
  footerContainer.id = "footer-container";
  document.body.appendChild(footerContainer);

  try {
    const footerResp = await fetch("componentes/footer.html");
    const footerHTML = await footerResp.text();
    footerContainer.innerHTML = footerHTML;
  } catch (erro) {
    console.error("Erro ao carregar o rodapé:", erro);
  }

  // CLOUDINHO
  const cloudinhoContainer = document.createElement("div");
  cloudinhoContainer.id = "cloudinho-container";
  document.body.appendChild(cloudinhoContainer);

  try {
    const cloudinhoResp = await fetch("componentes/cloudinho.html");
    const cloudinhoHTML = await cloudinhoResp.text();
    cloudinhoContainer.innerHTML = cloudinhoHTML;
  } catch (erro) {
    console.error("Erro ao carregar o Cloudinho:", erro);
  }
});
