# Flight Risk Intelligence Dashboard

Dashboard web interactivo creado a partir de `flights_clean_powerbi.csv`.

## Contenido

- `index.html`: estructura de la página.
- `styles.css`: diseño, colores, adaptación a celular y animaciones.
- `app.js`: filtros, tarjetas animadas y gráficos interactivos con Plotly.
- `data/dashboard_data.json`: datos agregados para que GitHub Pages cargue rápido.

## Gráficos incluidos

1. Distribución del estado de vuelos.
2. Porcentaje de cancelación por aerolínea.
3. Retraso promedio de llegada por aerolínea.
4. Relación entre retraso de salida y retraso de llegada.
5. Clasificación del riesgo predictivo.

## Publicación en GitHub Pages

1. Sube todos los archivos manteniendo la carpeta `data`.
2. En GitHub entra a `Settings`.
3. Selecciona `Pages`.
4. En `Build and deployment`, elige `Deploy from a branch`.
5. Selecciona la rama `main` y la carpeta `/(root)`.
6. Presiona `Save`.

La estructura debe quedar así:

```text
dashboard-inteligente-vuelos/
├── index.html
├── styles.css
├── app.js
├── README.md
└── data/
    └── dashboard_data.json
```

## Importante

No subas el CSV de 69 MB para que la página funcione. El archivo
`dashboard_data.json` ya contiene los cálculos y una muestra de puntos para el
gráfico de dispersión.
