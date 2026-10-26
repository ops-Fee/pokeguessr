<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

// Função robusta com duplo método (cURL e alternativa file_get_contents)
function buscarDadosPokemon($idOuNome) {
    $formatado = strtolower(trim($idOuNome));
    $url = "https://pokeapi.co/api/v2/pokemon/" . urlencode($formatado);
    
    // 1ª Tentativa: Usando cURL
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_USERAGENT, 'PHP-Pokedle-App');
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200 && $response) {
        return json_decode($response, true);
    }

    // 2ª Tentativa (Fallback): Usando stream context se o cURL for bloqueado pelo ambiente local
    $options = [
        "http" => [
            "method" => "GET",
            "header" => "User-Agent: PHP-Pokedle-App\r\n"
        ],
        "ssl" => [
            "verify_peer" => false,
            "verify_peer_name" => false,
        ]
    ];
    $context = stream_context_create($options);
    $responseAlt = @file_get_contents($url, false, $context);

    if ($responseAlt !== false) {
        return json_decode($responseAlt, true);
    }

    return null;
}

// Restante do código do jogo
if (!isset($_SESSION['secret_pokemon'])) {
    $randomId = rand(1, 151); // 1ª Geração (1 a 151)
    $_SESSION['secret_pokemon'] = buscarDadosPokemon($randomId);
}

$secret = $_SESSION['secret_pokemon'];

if (!$secret) {
    http_response_code(500);
    echo json_encode(['erro' => 'Erro crítico: Não foi possível obter o Pokémon secreto da API.']);
    exit;
}

$palpite = isset($_GET['palpite']) ? trim($_GET['palpite']) : '';

if (empty($palpite)) {
    http_response_code(400);
    echo json_encode(['erro' => 'Envie um palpite.']);
    exit;
}

$dadosPalpite = buscarDadosPokemon($palpite);

if (!$dadosPalpite) {
    http_response_code(404);
    echo json_encode(['erro' => 'Pokémon não encontrado!']);
    exit;
}

$resultado = [
    'nome' => $dadosPalpite['name'],
    'imagem' => $dadosPalpite['sprites']['front_default'] ?? '',
    'tipos' => compararTipos($dadosPalpite['types'], $secret['types']),
    'altura' => compararValores($dadosPalpite['height'], $secret['height']),
    'peso' => compararValores($dadosPalpite['weight'], $secret['weight']),
    'venceu' => ($dadosPalpite['name'] === $secret['name'])
];

echo json_encode($resultado);

function compararTipos($palpiteTypes, $secretTypes) {
    $pTypes = array_map(fn($t) => $t['type']['name'], $palpiteTypes);
    $sTypes = array_map(fn($t) => $t['type']['name'], $secretTypes);
    
    if ($pTypes == $sTypes) return 'correto';
    if (array_intersect($pTypes, $sTypes)) return 'parcial';
    return 'errado';
}

function compararValores($valPalpite, $valSecret) {
    if ($valPalpite == $valSecret) return 'correto';
    return $valPalpite < $valSecret ? 'maior' : 'menor';
}
?>