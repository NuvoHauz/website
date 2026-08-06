import { LanguageProvider } from "./context/LanguageContext";
import HomePage from "./components/HomePage";

export default function Home() {
  return (
    <LanguageProvider>
      <HomePage />
    </LanguageProvider>
  );
}
