/** @type {import('tailwindcss').Config} */
module.exports = {
  // Asegurate de que las rutas apunten a donde está tu código
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],

  // 👇 ESTA ES LA LÍNEA QUE FALTABA Y PEDÍA EL ERROR 👇
  presets: [require("nativewind/preset")],

  theme: {
    extend: {},
  },
  plugins: [],
}