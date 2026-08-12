import { initDatabase, closeDatabase } from './db.js';

async function main() {
  try {
    await initDatabase();
    console.log('Migração executada com sucesso.');
  } catch (error) {
    console.error('Erro ao executar migração:', error);
    process.exitCode = 1;
  } finally {
    await closeDatabase();
  }
}

main();
