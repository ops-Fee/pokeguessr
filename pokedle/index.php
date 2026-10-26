<?php
session_start();

// Se o utilizador clicou no botão de novo jogo, limpa o ID secreto anterior
if (isset($_GET['novo'])) {
    unset($_SESSION['secret_id']);
    header("Location: index.php");
    exit;
}

if (!isset($_SESSION['secret_id'])) {
    $_SESSION['secret_id'] = rand(1, 151);
}
$secretId = $_SESSION['secret_id'];
?>
<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PokeGuessr - Adivinhe o Pokémon</title>
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body class="bg-light d-flex justify-content-center align-items-center min-vh-100">
    
    <main class="container card shadow p-4 text-center" style="max-width: 600px; border-radius: 16px;">
        
       <!-- Cabeçalho com o novo nome e o botão de Novo Pokémon -->
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h1 class="text-warning fw-bold m-0">PokeGuessr</h1>
            <a href="index.php?novo=1" class="btn btn-outline-secondary btn-sm">🔄 Novo Pokémon</a>
        </div>
        
        <p class="text-muted">Adivinhe o Pokémon secreto da 1ª Geração!</p>

        <!-- Formulário e caixa de sugestões personalizada -->
        <div class="position-relative mb-4">
            <form id="pokedleForm" class="input-group">
                <input type="text" id="pokemonInput" class="form-control" placeholder="Digite um palpite..." required autocomplete="off">
                <button class="btn btn-warning fw-bold text-dark" type="submit">Chutar</button>
            </form>
            <div id="sugestoesBox" class="list-group position-absolute w-100 shadow rounded-bottom" style="z-index: 1000; max-height: 200px; overflow-y: auto; display: none;"></div>
        </div>
            <!-- Caixinha de sugestões personalizada -->
            <div id="sugestoesBox" class="list-group position-absolute w-100 shadow rounded-bottom" style="z-index: 1000; max-height: 200px; overflow-y: auto; display: none;"></div>
        </div>

        <div class="table-responsive">
            <table class="table table-bordered align-middle" id="tabelaPalpites">
                <thead class="table-dark">
                    <tr>
                        <th>Pokémon</th>
                        <th>Tipo 1</th>
                        <th>Tipo 2</th>
                        <th>Altura</th>
                        <th>Peso</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    </main>

    <!-- Créditos / Copyright -->
    <div class="footer-credit">
        Desenvolvido por: <br>
        Felipe R. Borges & Ana Laura D. Squiapati © 2026
    </div>

    <!-- SweetAlert2 JS -->
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script>
        const SECRET_ID = <?php echo $secretId; ?>;
    </script>
    <script src="assets/js/pokedle.js"></script>
</body>
</html>