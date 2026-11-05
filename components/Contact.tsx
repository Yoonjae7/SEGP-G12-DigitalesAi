import { copy } from '@/lib/copy';

/** The university wellbeing service email. It is a mailto link, so the page itself sends nothing. */
export function WellbeingEmail() {
  const email = copy.contacts.wellbeingEmail;
  return <a className="mail" href={`mailto:${email}`}>{email}</a>;
}

/** The project group leader's email, for questions about the study. */
export function GroupLeaderEmail() {
  const email = copy.contacts.groupLeaderEmail;
  return <a className="mail" href={`mailto:${email}`}>{email}</a>;
}
