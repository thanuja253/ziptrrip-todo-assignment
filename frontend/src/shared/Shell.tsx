import type { ReactNode } from 'react'

type Props = {
  kicker: string
  children: ReactNode
}

export function Shell({ kicker, children }: Props) {
  return (
    <div className="desk">
      <header className="mast">
        <a className="mark" href="/">
          ziptrrip
        </a>
        <p className="kicker">{kicker}</p>
      </header>
      {children}
      <footer className="colophon">
        Two pages. Two HTML documents. Not a client-side router.
      </footer>
    </div>
  )
}
