# QR code

Points straight at `https://baz.chrisquinn.ie/#/baz` — into the conversation, not the landing
page, so scanning it costs no extra tap. No redirect and no third party: what the code encodes
is where it goes, which also means it cannot quietly break or be repointed.

- `src/assets/qr/open-baz.svg` — what the landing page renders. 1.5 kB.
- `public/open-baz-qr.png` — 2048px, for slides and print.

Error correction is level M rather than H. The URL is short, so M keeps the code to a low
version with chunky modules, and big modules scan from further away than a dense code with more
redundancy. Black on white rather than the brand navy: the job is to scan.

## Regenerating

If the domain or the route changes, the code has to be regenerated — it is a picture of a URL,
and nothing in the build checks that the URL still exists.

```sh
npx -y qrcode -o src/assets/qr/open-baz.svg -t svg -e M -w 1024 'https://baz.chrisquinn.ie/#/baz'
npx -y qrcode -o public/open-baz-qr.png     -t png -e M -w 2048 'https://baz.chrisquinn.ie/#/baz'
```

Then check it: open the page, photograph the code with a phone, and confirm where it lands.
