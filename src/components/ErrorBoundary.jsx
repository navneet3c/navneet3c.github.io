import { Component } from 'preact';

export class ErrorBoundary extends Component {
  state = { error: null };

  componentDidCatch(error) {
    this.setState({ error });
  }

  render() {
    if (this.state.error) {
      return (
        <div
          class="card"
          style="margin: 1rem; border-color: var(--danger); color: var(--danger);"
        >
          <strong>Something went wrong</strong>
          <p style="font-size: 0.85rem; margin: 0.5rem 0 0; color: var(--text-muted);">
            {this.state.error?.message || String(this.state.error)}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
