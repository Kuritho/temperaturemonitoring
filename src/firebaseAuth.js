// src/firebaseAuth.js
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { app } from './firebase';

// Initialize Firebase Authentication
const auth = getAuth(app);

// Use the same credentials you created in Firebase Authentication
const loginToFirebase = async () => {
  try {
    // IMPORTANT: Replace these with the credentials you created in Firebase Console
    const email = "esp32@fan-controller.com";  // Replace with your auth email
    const password = "Test123456";  // Replace with your auth password
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("✅ Logged in successfully:", userCredential.user.email);
    return true;
  } catch (error) {
    console.error("❌ Login error:", error.code, error.message);
    
    // Provide more helpful error messages
    switch(error.code) {
      case 'auth/invalid-credential':
        console.log("Invalid email or password. Check your credentials in Firebase Authentication");
        break;
      case 'auth/user-not-found':
        console.log("User not found. Create a user in Firebase Authentication → Users tab");
        break;
      case 'auth/wrong-password':
        console.log("Wrong password. Check the password you set in Firebase Authentication");
        break;
      case 'auth/too-many-requests':
        console.log("Too many failed attempts. Try again later");
        break;
      default:
        console.log("Authentication failed:", error.message);
    }
    return false;
  }
};

export { auth, loginToFirebase };