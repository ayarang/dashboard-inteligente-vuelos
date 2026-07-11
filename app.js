const COLORS = {
  blue: "#2d91ff",
  red: "#ff4b68",
  orange: "#ff8d3a",
  yellow: "#ffd25b",
  purple: "#9f58ff",
  green: "#45d798",
  text: "#f6f9ff",
  muted: "#9eabc2",
  grid: "rgba(255,255,255,0.08)"
};

const CONFIG = {
  displayModeBar: false,
  responsive: true
};

const BASE_LAYOUT = {
  paper_bgcolor: "rgba(0,0,0,0)",
  plot_bgcolor: "rgba(0,0,0,0)",
  font: {
    color: COLORS.text,
    family: 'Inter, "Segoe UI", Arial, sans-serif',
    size: 12
  },
  hoverlabel: {
    bgcolor: "#101a31",
    bordercolor: "rgba(255,255,255,.18)",
    font: { color: COLORS.text }
  },
  transition: {
    duration: 520,
    easing: "cubic-in-out"
  }
};

let DATA = null;
let currentAirline = "__all__";

const numberFormatter = new Intl.NumberFormat("es-PE", {
  maximumFractionDigits: 0
});

function formatNumber(value) {
  return numberFormatter.format(Number(value || 0));
}

function formatPercent(value, decimals = 2) {
  return `${Number(value || 0).toFixed(decimals)}%`;
}

function animateNumber(element, value, options = {}) {
  const {
    suffix = "",
    decimals = 0,
    duration = 850
  } = options;

  const target = Number(value || 0);
  const startTime = performance.now();

  function frame(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = target * eased;

    element.textContent = decimals > 0
      ? `${current.toFixed(decimals)}${suffix}`
      : `${formatNumber(current)}${suffix}`;

    if (progress < 1) {
      requestAnimationFrame(frame);
    }
  }

  requestAnimationFrame(frame);
}

function updateKpis(summary) {
  animateNumber(document.getElementById("kpiTotal"), summary.total_vuelos);
  animateNumber(document.getElementById("kpiCancel"), summary.pct_cancelados, {
    suffix: "%",
    decimals: 2
  });
  animateNumber(document.getElementById("kpiDelay"), summary.pct_retrasados, {
    suffix: "%",
    decimals: 2
  });
  animateNumber(document.getElementById("kpiArrDelay"), summary.prom_retraso_llegada, {
    suffix: " min",
    decimals: 2
  });
  animateNumber(document.getElementById("kpiProbability"), summary.prob_cancelacion, {
    decimals: 2
  });
}

function drawDonut(elementId, rows, colors, centerLabel) {
  const values = rows.map(row => row.value);
  const total = values.reduce((sum, value) => sum + value, 0);

  const data = [{
    type: "pie",
    labels: rows.map(row => row.name),
    values,
    hole: 0.64,
    sort: false,
    marker: {
      colors,
      line: {
        color: "rgba(7,11,22,.75)",
        width: 3
      }
    },
    textinfo: "label+percent",
    textposition: "outside",
    automargin: true,
    hovertemplate:
      "<b>%{label}</b><br>" +
      "%{value:,.0f} vuelos<br>" +
      "%{percent}<extra></extra>"
  }];

  const layout = {
    ...BASE_LAYOUT,
    margin: { l: 22, r: 22, t: 18, b: 18 },
    showlegend: false,
    annotations: [{
      text:
        `<b>${formatNumber(total)}</b>` +
        `<br><span style="font-size:11px;color:${COLORS.muted}">${centerLabel}</span>`,
      showarrow: false,
      font: { color: COLORS.text, size: 20 }
    }]
  };

  Plotly.react(elementId, data, layout, CONFIG);
}

function selectedBarColors(rows, selected, defaultColor) {
  return rows.map(row => {
    if (selected === "__all__") {
      return defaultColor;
    }
    return row.Airline === selected ? COLORS.yellow : "rgba(159,171,194,.34)";
  });
}

function drawCancellationBars(rows, selected) {
  const visibleRows = rows.slice(0, 15);

  const trace = {
    type: "bar",
    orientation: "h",
    x: visibleRows.map(row => row.cancel_rate),
    y: visibleRows.map(row => row.Airline),
    marker: {
      color: selectedBarColors(visibleRows, selected, COLORS.red),
      line: { color: "rgba(255,255,255,.10)", width: 1 }
    },
    customdata: visibleRows.map(row => row.total),
    hovertemplate:
      "<b>%{y}</b><br>" +
      "Cancelación: %{x:.2f}%<br>" +
      "Vuelos: %{customdata:,.0f}<extra></extra>"
  };

  const layout = {
    ...BASE_LAYOUT,
    margin: { l: 184, r: 22, t: 18, b: 50 },
    xaxis: {
      title: "% cancelados",
      gridcolor: COLORS.grid,
      zeroline: false,
      ticksuffix: "%"
    },
    yaxis: {
      autorange: "reversed",
      gridcolor: "rgba(0,0,0,0)",
      tickfont: { size: 10 }
    },
    bargap: 0.28
  };

  Plotly.react("chartCancelAirline", [trace], layout, CONFIG);
}

function drawDelayBars(rows, selected) {
  const visibleRows = rows.slice(0, 15);

  const trace = {
    type: "bar",
    x: visibleRows.map(row => row.Airline),
    y: visibleRows.map(row => row.avg_arr_delay),
    marker: {
      color: selectedBarColors(visibleRows, selected, COLORS.orange),
      line: { color: "rgba(255,255,255,.10)", width: 1 }
    },
    customdata: visibleRows.map(row => row.total),
    hovertemplate:
      "<b>%{x}</b><br>" +
      "Retraso promedio: %{y:.2f} min<br>" +
      "Vuelos: %{customdata:,.0f}<extra></extra>"
  };

  const layout = {
    ...BASE_LAYOUT,
    margin: { l: 58, r: 20, t: 18, b: 135 },
    xaxis: {
      gridcolor: "rgba(0,0,0,0)",
      tickangle: -48,
      tickfont: { size: 9 }
    },
    yaxis: {
      title: "Minutos",
      gridcolor: COLORS.grid,
      zeroline: false
    },
    bargap: 0.24
  };

  Plotly.react("chartDelayAirline", [trace], layout, CONFIG);
}

function drawScatter(rows) {
  const riskOrder = ["Bajo", "Medio", "Alto"];
  const riskColors = {
    Bajo: COLORS.blue,
    Medio: COLORS.orange,
    Alto: COLORS.red
  };

  const traces = riskOrder.map(risk => {
    const group = rows.filter(row => row.Riesgo_Predictivo === risk);

    return {
      type: "scattergl",
      mode: "markers",
      name: risk,
      x: group.map(row => row.DepDelayMinutes),
      y: group.map(row => row.ArrDelayMinutes),
      text: group.map(row => `${row.Airline}<br>${row.Ruta}`),
      customdata: group.map(row => row.Distance),
      marker: {
        color: riskColors[risk],
        opacity: 0.68,
        size: group.map(row => {
          const distance = Number(row.Distance || 0);
          return Math.max(6, Math.min(19, 5 + distance / 190));
        }),
        line: { color: "rgba(255,255,255,.14)", width: 0.5 }
      },
      hovertemplate:
        "<b>%{text}</b><br>" +
        "Retraso salida: %{x:.1f} min<br>" +
        "Retraso llegada: %{y:.1f} min<br>" +
        "Distancia: %{customdata:.0f} mi<extra></extra>"
    };
  });

  const layout = {
    ...BASE_LAYOUT,
    margin: { l: 65, r: 24, t: 22, b: 60 },
    xaxis: {
      title: "DepDelayMinutes · retraso de salida",
      gridcolor: COLORS.grid,
      zerolinecolor: "rgba(255,255,255,.18)"
    },
    yaxis: {
      title: "ArrDelayMinutes · retraso de llegada",
      gridcolor: COLORS.grid,
      zerolinecolor: "rgba(255,255,255,.18)"
    },
    legend: {
      orientation: "h",
      x: 0,
      y: 1.09,
      title: { text: "Riesgo:" }
    }
  };

  Plotly.react("chartScatter", traces, layout, CONFIG);
}

function updateInsights(selected) {
  const highestCancel = DATA.cancel_by_airline[0];
  const highestDelay = DATA.delay_by_airline[0];

  document.getElementById("insightCancel").textContent =
    `${highestCancel.Airline} · ${formatPercent(highestCancel.cancel_rate)}`;

  document.getElementById("insightDelay").textContent =
    `${highestDelay.Airline} · ${highestDelay.avg_arr_delay.toFixed(2)} min`;

  document.getElementById("insightCorrelation").textContent =
    `r = ${DATA.summary.correlation_delay.toFixed(2)} · relación muy fuerte`;

  const text = selected === "__all__"
    ? `Se están analizando ${formatNumber(DATA.summary.total_vuelos)} vuelos. ` +
      `El ${formatPercent(DATA.summary.pct_retrasados)} presentó retraso y ` +
      `el ${formatPercent(DATA.summary.pct_cancelados)} fue cancelado.`
    : `La vista se encuentra filtrada por ${selected}. Los indicadores, las donas ` +
      `y la dispersión muestran únicamente los vuelos de esta aerolínea.`;

  document.getElementById("insightText").textContent = text;
}

function renderDashboard(selected = "__all__") {
  currentAirline = selected;

  const view = selected === "__all__"
    ? {
        summary: DATA.summary,
        state_counts: DATA.state_counts,
        risk_counts: DATA.risk_counts,
        scatter: DATA.scatter
      }
    : DATA.per_airline[selected];

  if (!view) {
    return;
  }

  updateKpis(view.summary);
  drawDonut(
    "chartEstado",
    view.state_counts,
    [COLORS.blue, COLORS.orange, COLORS.red],
    "vuelos"
  );
  drawDonut(
    "chartRiesgo",
    view.risk_counts,
    [COLORS.blue, COLORS.orange, COLORS.red],
    "clasificados"
  );
  drawCancellationBars(DATA.cancel_by_airline, selected);
  drawDelayBars(DATA.delay_by_airline, selected);
  drawScatter(view.scatter);
  updateInsights(selected);

  const status = selected === "__all__"
    ? "Mostrando todos los vuelos"
    : `Filtro activo: ${selected}`;

  document.getElementById("filterStatus").textContent = status;
}

function populateAirlines() {
  const select = document.getElementById("airlineSelect");

  DATA.airline_options.forEach(airline => {
    const option = document.createElement("option");
    option.value = airline;
    option.textContent = airline;
    select.appendChild(option);
  });

  select.addEventListener("change", event => {
    renderDashboard(event.target.value);
  });

  document.getElementById("resetBtn").addEventListener("click", () => {
    select.value = "__all__";
    renderDashboard("__all__");
  });
}

function hideLoader() {
  document.getElementById("loader").classList.add("hidden");
}

fetch("data/dashboard_data.json")
  .then(response => {
    if (!response.ok) {
      throw new Error(`No se pudo cargar dashboard_data.json (${response.status})`);
    }
    return response.json();
  })
  .then(data => {
    DATA = data;
    populateAirlines();
    renderDashboard("__all__");
    setTimeout(hideLoader, 450);
  })
  .catch(error => {
    console.error(error);

    const loader = document.getElementById("loader");
    loader.innerHTML = `
      <div class="loader-plane">⚠</div>
      <strong>No se pudieron cargar los datos</strong>
      <span>Verifica que exista: data/dashboard_data.json</span>
    `;
  });
