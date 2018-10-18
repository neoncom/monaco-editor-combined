prerequisite: install yarn from official source

clone this repo first and update submodules recursive

then run

- npm run init
- npm run build
- npm run publish

npm run publish will now tell you how to publish, it will NOT publish itsself

don't forget to commit this repo after running the commands (e.g. "patchfile" will be updated)

the submodules however will contain auto generated files that you can ignore

NOTE: if you want to update monaco editor, merge the upstream branches of the submodules (use the versions of the packages that the official monacoeditor also uses)