# components/

`ui/` holds generic, brand-styled primitives (`Button`, `Card`, `Badge`, `Spinner`, `ProgressBar`) that have **zero knowledge of Koushol's business logic** — each one could be copy-pasted into a different app unchanged.

If a component knows about courses, chapters, quizzes, enrollment, or auth, it does not belong here — put it in the relevant `features/<name>/components/` folder instead.
