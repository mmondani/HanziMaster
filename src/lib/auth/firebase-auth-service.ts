import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, getDocFromCache, type FirestoreError } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { UnreachableError, type AuthService } from './auth-service';

function isUnavailable(error: unknown): boolean {
  return (error as FirestoreError | undefined)?.code === 'unavailable';
}

export function createFirebaseAuthService(): AuthService {
  const provider = new GoogleAuthProvider();
  // Siempre pide elegir cuenta: "Probar con otra cuenta" (A02-3) no debe reutilizar la anterior.
  provider.setCustomParameters({ prompt: 'select_account' });

  return {
    subscribe(listener) {
      return onAuthStateChanged(auth, (user) => {
        listener(user && user.email ? { uid: user.uid, email: user.email } : null);
      });
    },
    async signInWithGoogle() {
      await signInWithPopup(auth, provider);
    },
    signOut: () => signOut(auth),
    async isEmailAllowed(email) {
      const ref = doc(db, 'allowedEmails', email.toLowerCase());
      try {
        return (await getDoc(ref)).exists();
      } catch (error) {
        if (!isUnavailable(error)) throw error;
        // Sin red: si el documento quedó en la caché local, la sesión sigue siendo válida.
        try {
          return (await getDocFromCache(ref)).exists();
        } catch {
          throw new UnreachableError();
        }
      }
    },
  };
}
