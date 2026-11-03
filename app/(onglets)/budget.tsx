import { Section } from '@/src/ui/Liste';
import { Ecran } from '@/src/ui/Ecran';
import { Texte } from '@/src/ui/Texte';

export default function Budget() {
  return (
    <Ecran titre="Budget" onglet>
      <Section pied="Le budget par enveloppes arrive avec le bloc 4.">
        <Texte variante="secondaire" style={{ padding: 16 }}>Bientôt</Texte>
      </Section>
    </Ecran>
  );
}
