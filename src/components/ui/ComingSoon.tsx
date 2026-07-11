import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";

type ComingSoonProps = {
  title: string;
  description?: string;
  badge?: string;
};

export function ComingSoon({
  title,
  description,
  badge = "Próximamente",
}: ComingSoonProps) {
  return (
    <section className="relative py-20 sm:py-28">
      <Container className="relative text-center">
        <SectionHeader badge={badge} title={title} description={description} />
      </Container>
    </section>
  );
}
