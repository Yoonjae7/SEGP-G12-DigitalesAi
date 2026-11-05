import { readLab } from '../log/lab';

/** ?fail=1 on any page turns on the demo error path for this tab. ?fail=0 turns it off. The Lab switch does the same. */
export function failFlag(): boolean {
  try {
    const q = new URLSearchParams(location.search).get('fail');
    if (q === '1') sessionStorage.setItem('dt_fail', '1');
    if (q === '0') sessionStorage.removeItem('dt_fail');
    return sessionStorage.getItem('dt_fail') === '1' || readLab().forceFail;
  } catch {
    return false;
  }
}
