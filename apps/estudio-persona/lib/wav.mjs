/** Gera um WAV mono silencioso (usado no modo demonstração, quando o ElevenLabs não está conectado). */
export function wavSilencioso(segundos, taxa = 16000) {
  const amostras = Math.round(segundos * taxa);
  const dados = amostras * 2;
  const b = Buffer.alloc(44 + dados);
  b.write('RIFF', 0); b.writeUInt32LE(36 + dados, 4); b.write('WAVE', 8);
  b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(taxa, 24); b.writeUInt32LE(taxa * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34);
  b.write('data', 36); b.writeUInt32LE(dados, 40);
  return b;
}
