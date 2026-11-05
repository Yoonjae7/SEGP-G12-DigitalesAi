import { copy } from '@/lib/copy';

/** The university wellbeing service email. It is a mailto link, so the page itself sends nothing. */
export function WellbeingEmail() {
  const email = copy.contacts.wellbeingEmail;
  return <a className="mail" href={`mailto:${email}`}>{email}</a>;
}

/** The project group leader: name, then email. */
export function GroupLeader() {
  const { groupLeaderName: name, groupLeaderEmail: email } = copy.contacts;
  return (
    <>
      <span className="who-name">{name}</span>
      <br />
      <a className="mail" href={`mailto:${email}`}>{email}</a>
    </>
  );
}
