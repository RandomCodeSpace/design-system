# Lockfile-based version bump helper.
# Usage:
#   pnpm version patch    # 0.1.0 → 0.1.1
#   pnpm version minor    # 0.1.0 → 0.2.0
#   pnpm version major    # 0.1.0 → 1.0.0
#
# This emits a tag (vX.Y.Z) which the release workflow watches.

git push --follow-tags
