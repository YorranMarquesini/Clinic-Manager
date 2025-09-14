function carregarAvisos() {
    const avisos = JSON.parse(localStorage.getItem("avisos")) || [];
    const container = document.getElementById("infoCards");

    if (avisos.length === 0) {
      container.innerHTML = "<p>Sem avisos no momento.</p>";
      return;
    }

    container.innerHTML = avisos.map((aviso, i) => `
      <div class="card" data-aos="fade-up" data-aos-delay="${i * 100}">
        ${aviso}
      </div>
    `).join("");
  }

  carregarAvisos();
