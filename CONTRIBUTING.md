# Contributing to MixerAI

Thank you for your interest in contributing to MixerAI! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please read it before contributing.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone git@github.com:your-username/mixer-ai.git
   cd mixer-ai
   ```
3. Create a branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in your environment variables:
   ```bash
   cp .env.example .env.local
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Making Changes

### Coding Standards

- Use TypeScript for all new code
- Follow the existing code style
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused
- Use React hooks appropriately
- Follow Next.js best practices

### Testing

- Write tests for new features
- Update existing tests when modifying features
- Run the test suite before submitting:
  ```bash
  npm run test
  ```

### Commits

- Use clear and meaningful commit messages
- Follow conventional commits format:
  - feat: New feature
  - fix: Bug fix
  - docs: Documentation changes
  - style: Code style changes
  - refactor: Code refactoring
  - test: Test updates
  - chore: Routine tasks, maintenance

## Pull Requests

1. Update your fork to the latest main branch
2. Create a pull request from your feature branch
3. Include a clear description of the changes
4. Reference any related issues
5. Ensure all tests pass
6. Request review from maintainers

### PR Description Template

```markdown
## Description
[Describe your changes here]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Manually tested changes

## Screenshots
[If applicable, add screenshots]

## Related Issues
Fixes #[issue number]
```

## Working with Supabase

### Database Changes

1. Create new migrations in `supabase/migrations/`
2. Test migrations locally
3. Document schema changes
4. Update types if necessary

### Edge Functions

1. Add new functions in `supabase/functions/`
2. Follow the existing pattern for CORS and error handling
3. Test functions locally using the Supabase CLI
4. Document new endpoints

## Documentation

- Update README.md for significant changes
- Document new features and APIs
- Keep code comments up to date
- Update TypeScript types

## Review Process

1. Automated checks must pass
2. Code review by at least one maintainer
3. Changes must be tested
4. Documentation must be updated

## Release Process

1. Version bump following semver
2. Update CHANGELOG.md
3. Create release notes
4. Tag the release

## Getting Help

- Join our Discord community
- Check existing issues and discussions
- Ask questions in pull requests
- Contact maintainers

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License. 