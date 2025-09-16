document.getElementById("loginForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const user = document.getElementById("username").value;
    const pass = document.getElementById("password").value;
    const errorMsg = document.getElementById("errorMsg");

    // Pegar lista de usuários do localStorage
    let usuarios = JSON.parse(localStorage.getItem("funcionarios")) || [];

    // Para fins de teste, garante que o admin exista
    if(!usuarios.find(u => u.username === "admin")) {
        usuarios.push({ nome: "Administrador", username: "admin", password: "1234", tipo: "admin" });
        localStorage.setItem("funcionarios", JSON.stringify(usuarios));
    }

    // Procurar usuário que bate com login e senha
    let usuarioLogado = usuarios.find(u => u.username === user && u.password === pass);
    // se não achar no array de funcionários, procura nos pacientes
     if (!usuarioLogado) {
    const pacientes = JSON.parse(localStorage.getItem("pacientes")) || [];
    usuarioLogado = pacientes.find(p => p.login === user && p.senha === pass);
    if(usuarioLogado) usuarioLogado.tipo = "paciente";
}
if(usuarioLogado) {
    localStorage.setItem("usuarioLogado", JSON.stringify(usuarioLogado));
    if(usuarioLogado.tipo === "admin") window.location.href = "dashboard-admin.html";
    else if(usuarioLogado.tipo === "paciente") window.location.href = "usuario.html";
    else window.location.href = "DashBoard.html"; // funcionário
} else {
    errorMsg.textContent = "Usuário ou senha incorretos!";
}
});
