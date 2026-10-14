import { readFileSync } from 'node:fs';
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';

let env: RulesTestEnvironment;

const ALLOWED = 'ana@gmail.com';
const OTHER = 'otro@gmail.com';

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-hanzi-rules',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  });
});
afterAll(() => env.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'allowedEmails', ALLOWED), { email: ALLOWED });
    await setDoc(doc(ctx.firestore(), 'users/ana/languages/zh'), { name: 'Chino' });
  });
});

const ana = () => env.authenticatedContext('ana', { email: ALLOWED, email_verified: true }).firestore();
const intruso = () => env.authenticatedContext('intruso', { email: OTHER, email_verified: true }).firestore();

describe('allowedEmails', () => {
  it('un usuario puede leer su propio documento', async () => {
    await assertSucceeds(getDoc(doc(ana(), 'allowedEmails', ALLOWED)));
  });
  it('un usuario no puede leer el documento de otro email', async () => {
    await assertFails(getDoc(doc(ana(), 'allowedEmails', OTHER)));
  });
  it('no se puede listar la colección', async () => {
    await assertFails(getDocs(collection(ana(), 'allowedEmails')));
  });
  it('no se puede escribir desde el cliente', async () => {
    await assertFails(setDoc(doc(ana(), 'allowedEmails', OTHER), { email: OTHER }));
  });
  it('sin sesión no se puede leer', async () => {
    await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), 'allowedEmails', ALLOWED)));
  });
});

describe('datos del usuario', () => {
  it('el dueño habilitado lee y escribe sus datos', async () => {
    await assertSucceeds(getDoc(doc(ana(), 'users/ana/languages/zh')));
    await assertSucceeds(setDoc(doc(ana(), 'users/ana/flashcards/c1'), { word: '你好' }));
  });
  it('los campos de la iteración 001 (createdAt en mazos, defaultModes en idiomas) se escriben sin cambios de reglas', async () => {
    const mode = { id: 'm1', name: 'Directo', frontLayoutId: 'ly1', backLayoutId: 'ly2' };
    await assertSucceeds(setDoc(doc(ana(), 'users/ana/decks/d1'), { name: 'HSK 1', cardIds: [], modes: [mode], learning: 'free', createdAt: 1 }));
    await assertSucceeds(setDoc(doc(ana(), 'users/ana/languages/zh'), { name: 'Chino', defaultModes: [mode] }));
  });
  it('otro usuario no accede a datos ajenos aunque esté habilitado', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'allowedEmails', OTHER), { email: OTHER });
    });
    await assertFails(getDoc(doc(intruso(), 'users/ana/languages/zh')));
    await assertFails(setDoc(doc(intruso(), 'users/ana/languages/zh'), { name: 'x' }));
  });
  it('un email que no está en allowedEmails no accede ni a sus propios datos', async () => {
    await assertFails(getDoc(doc(intruso(), 'users/intruso/languages/zh')));
    await assertFails(setDoc(doc(intruso(), 'users/intruso/languages/zh'), { name: 'x' }));
  });
  it('un email sin verificar no accede', async () => {
    const db = env.authenticatedContext('ana', { email: ALLOWED, email_verified: false }).firestore();
    await assertFails(getDoc(doc(db, 'users/ana/languages/zh')));
  });
  it('sin sesión no se accede', async () => {
    await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), 'users/ana/languages/zh')));
  });
  it('rutas fuera del modelo están denegadas', async () => {
    await assertFails(setDoc(doc(ana(), 'otra/x'), { a: 1 }));
  });
});
