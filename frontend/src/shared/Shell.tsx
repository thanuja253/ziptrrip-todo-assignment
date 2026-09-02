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
    </div>
  )
}
