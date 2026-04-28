// ================================================================
// AGENTE DE COBRANZA SOLFIUM v2.0
// ----------------------------------------------------------------
// Pega este script en la consola de Chrome (F12 > Console)
// mientras tienes Zuno abierto en services.solfium.com
// ================================================================

const CONFIG = {
  TOKEN: 'mEiTF63m2M0JSpFnnyunvY1AqyCa3m',
  USER_ID: 61736,   // ID fijo de la cuenta de Carla en el chat
  DRY_RUN: true,    // ← cambiar a false para enviar de verdad
  DELAY_MS: 2000,
};

const BASE_DESK = 'https://services.solfium.com/solfapi/desk/api/auth';
const BASE_CHAT = 'https://services.solfium.com/solfapi/chat/api/auth';

const H = {
  'Authorization': `Bearer ${CONFIG.TOKEN}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// ================================================================
// CLIENTES — solo se envían los marcados aprobado: true
// ================================================================
const CLIENTES = [
  {
    proyectoId: 55313,
    nombre: 'Juan',
    escenario: 'C',
    aprobado: false,
    nota: '✅ Mensaje ya enviado el 28/04/2026',
    mensaje:
`Hola Juan, soy Carla de Solfium 👋

Revisé el historial de tu proyecto
(ID: 55313) y quiero asegurarme de
que todo quedó a tu entera satisfacción.

Entiendo que tuviste observaciones con
algunos detalles del proceso — me alegra
saber que ya fueron atendidos.

Me gustaría platicar contigo sobre el
saldo pendiente de tu proyecto y
encontrar juntos la mejor solución.
¿Tienes disponibilidad esta semana?

🌞 — Carla, Solfium`,
  },
  {
    proyectoId: 56080,
    nombre: 'Margie',
    escenario: 'D',
    aprobado: true,
    mensaje:
`Hola Margie, soy Carla de Solfium 👋

Te escribo nuevamente respecto a tu
proyecto solar (ID: 56080) que tiene
un saldo pendiente de $25,218 MXN.

Tu sistema está activo y generando un
35% de ahorro en tu recibo de CFE ⚡

¿Pudiste revisar nuestros mensajes anteriores?
Con gusto te ayudo a resolver esto.
¿Cuándo podrías realizar el pago?

🌞 — Carla, Solfium`,
  },
  {
    proyectoId: 36828,
    nombre: 'César',
    escenario: 'C',
    aprobado: false,
    nota: 'Conflicto severo — pendiente aprobación Carla',
  },
  {
    proyectoId: 49959,
    nombre: 'José María',
    escenario: 'A',
    aprobado: false,
    nota: 'Alianza (Veronica Marin) — pendiente aprobación Carla',
  },
  {
    proyectoId: 57444,
    nombre: 'Mario',
    escenario: 'A',
    aprobado: false,
    nota: 'Alianza (Jesus Gutierrez) — pendiente aprobación Carla',
  },
];

// ================================================================
// API HELPERS
// ================================================================
async function buscarCliente(proyectoId) {
  const url = `${BASE_DESK}/clients/?page=1&filterModel=%7B%7D&quickfiltersearch=${proyectoId}&pagesize=27&buttonFilter=completeClients`;
  const res = await fetch(url, { headers: H });
  if (!res.ok) throw new Error(`HTTP ${res.status} buscando cliente ${proyectoId}`);
  return res.json();
}


async function enviarMensaje(roomId, userId, mensaje) {
  if (CONFIG.DRY_RUN) {
    console.log(`%c[DRY RUN] Mensaje para room_id=${roomId} user_id=${userId}:\n${mensaje}`, 'color: orange');
    return { dry_run: true, room_id: roomId, user_id: userId };
  }
  const res = await fetch(`${BASE_CHAT}/chats/`, {
    method: 'POST',
    headers: H,
    body: JSON.stringify({ room_id: roomId, user_id: userId, message: mensaje }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`HTTP ${res.status} enviando mensaje — ${txt}`);
  }
  return res.json();
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ================================================================
// EXTRAE room_id y user_id de la respuesta del chat
// ================================================================
// room_id = installation_ia del cliente (confirmado: room_ia_id === installation_ia)
function extraerRoomId(searchData) {
  const results = searchData.result || searchData.results || searchData;
  if (Array.isArray(results) && results.length > 0) {
    return results[0].installation_ia;
  }
  return null;
}

// ================================================================
// PROCESO PRINCIPAL POR CLIENTE
// ================================================================
async function procesarCliente(cliente) {
  const tag = `ID ${cliente.proyectoId} (${cliente.nombre})`;

  if (!cliente.aprobado) {
    console.log(`%c⏸️  ${tag} — ${cliente.nota || 'Pendiente aprobación'}`, 'color: gray');
    return { id: cliente.proyectoId, nombre: cliente.nombre, status: '⏸️ Pendiente' };
  }

  console.log(`%c\n🔄 Procesando: ${tag}`, 'color: dodgerblue; font-weight: bold');

  try {
    // 1. Buscar cliente → obtener installation_ia como room_id
    const searchData = await buscarCliente(cliente.proyectoId);
    const roomId = extraerRoomId(searchData);

    if (!roomId) {
      console.warn(`   ⚠️  No se encontró installation_ia para ${cliente.proyectoId}`);
      return { id: cliente.proyectoId, nombre: cliente.nombre, status: '❌ Sin room_id' };
    }

    console.log(`   ✉️  room_id=${roomId} | user_id=${CONFIG.USER_ID}`);

    // 2. Enviar mensaje
    const resultado = await enviarMensaje(roomId, CONFIG.USER_ID, cliente.mensaje);
    console.log(`   ✅ Respuesta envío:`, resultado);

    return { id: cliente.proyectoId, nombre: cliente.nombre, status: '✅ Enviado' };

  } catch (err) {
    console.error(`   ❌ Error:`, err.message);
    return { id: cliente.proyectoId, nombre: cliente.nombre, status: `❌ ${err.message}` };
  }
}

// ================================================================
// RUNNER
// ================================================================
async function correrAgente() {
  console.clear();
  console.log('%c═══════════════════════════════════════════', 'color: #2ecc71');
  console.log('%c  🤖 AGENTE DE COBRANZA SOLFIUM v2.0', 'color: #2ecc71; font-weight: bold');
  console.log(`%c  Modo: ${CONFIG.DRY_RUN ? '🔍 SIMULACIÓN (DRY RUN)' : '🚀 ENVÍO REAL'}`, CONFIG.DRY_RUN ? 'color: orange' : 'color: #e74c3c; font-weight: bold');
  console.log('%c═══════════════════════════════════════════\n', 'color: #2ecc71');

  const resultados = [];

  for (const cliente of CLIENTES) {
    const r = await procesarCliente(cliente);
    resultados.push(r);
    await sleep(CONFIG.DELAY_MS);
  }

  console.log('\n%c═══════════════════════════════════════════', 'color: #2ecc71');
  console.log('%c  📊 RESUMEN FINAL', 'color: #2ecc71; font-weight: bold');
  console.log('%c═══════════════════════════════════════════', 'color: #2ecc71');
  resultados.forEach(r => console.log(`  ${r.id} — ${r.nombre}: ${r.status}`));
  console.log('%c═══════════════════════════════════════════', 'color: #2ecc71');
}

correrAgente().catch(err => console.error('Error crítico:', err));
