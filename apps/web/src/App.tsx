import { EditorPage } from "./components/editor/EditorPage";
import { mockMotif } from "./fixtures/mockMotif";

export function App() {
  return <EditorPage initialMotif={mockMotif} />;
}
