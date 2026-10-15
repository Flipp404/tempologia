# Tempologia

Aplicativo mobile de previsão do tempo, desenvolvido com React Native e Expo como **projeto extensionista** para apresentação na faculdade.

<!-- Adicione aqui um print do app: ![Tela do Tempologia](./prints/home.png) -->

## O que ele faz

- Detecta a localização do dispositivo e mostra o clima atual da cidade
- Usa o Rio de Janeiro como localização padrão se a permissão for negada
- Permite buscar qualquer cidade pelo nome
- Mostra temperatura, ícone e descrição do clima atual
- Exibe a previsão dos próximos dias, com máxima e mínima
- Atualiza os dados ao puxar a tela para baixo (pull to refresh)
- Trata erros de rede e cidades não encontradas

## Tecnologias

- **React Native** com **Expo**
- **expo-location**: geolocalização e geocodificação reversa
- **axios**: requisições HTTP
- **@expo/vector-icons** (Feather): ícones do clima

## APIs utilizadas

- [Open-Meteo](https://open-meteo.com/): dados de clima e previsão (gratuita e sem chave de API)
- [Nominatim (OpenStreetMap)](https://nominatim.org/): converte o nome da cidade em coordenadas

## Como funciona

1. O app pede permissão de localização e obtém as coordenadas
2. Consulta a Open-Meteo com essas coordenadas
3. Converte o código de clima (WMO) em um ícone e uma descrição em português
4. Na busca por cidade, o Nominatim retorna as coordenadas e o fluxo se repete

## Como rodar

O repositório contém apenas o componente da tela (`tempologia.jsx`). Para testar:

```bash
npx create-expo-app tempologia-app
cd tempologia-app
npx expo install expo-location @expo/vector-icons
npm install axios
```

Depois, substitua o conteúdo de `App.js` pelo de `tempologia.jsx` (ou importe o componente) e rode:

```bash
npx expo start
```

Abra no celular com o app **Expo Go** ou em um emulador.

## Autor

**Felipe Lemos**: [GitHub](https://github.com/Flipp404) · [LinkedIn](https://www.linkedin.com/in/felipe-lemos-82a927255/)
