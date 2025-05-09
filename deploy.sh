#!/bin/sh

echo '========== publish library =========='
npm publish --access=public

echo '========== push to git =========='
git push origin master --tags
