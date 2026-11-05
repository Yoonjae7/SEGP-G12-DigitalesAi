'use client';

import { useEffect, useState } from 'react';
import { LAB_DEFAULT, readLab, type LabSettings } from './log/lab';

/** Team switches from the Lab view. Defaults leave everything on. Read once per page load. */
export function useLabFlags(): LabSettings {
  const [lab, setLab] = useState<LabSettings>(LAB_DEFAULT);
  useEffect(() => setLab(readLab()), []);
  return lab;
}
