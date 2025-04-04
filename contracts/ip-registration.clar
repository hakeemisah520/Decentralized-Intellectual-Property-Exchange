;; IP Registration Contract
;; Records ownership of patents and technologies

;; Define data maps to store IP information
(define-map ip-registry
  { id: uint }
  {
    owner: principal,
    title: (string-utf8 256),
    description: (string-utf8 1024),
    creation-date: uint,
    registration-date: uint,
    expiration-date: uint,
    is-active: bool
  }
)

;; Counter for IP IDs
(define-data-var next-id uint u1)

;; Get the next available ID and increment the counter
(define-private (get-next-id)
  (let ((id (var-get next-id)))
    (var-set next-id (+ id u1))
    id
  )
)

;; Register a new IP
(define-public (register-ip (title (string-utf8 256)) (description (string-utf8 1024)) (expiration-date uint))
  (let
    (
      (id (get-next-id))
      (current-time (unwrap-panic (get-block-info? time (- block-height u1))))
    )
    (map-insert ip-registry
      { id: id }
      {
        owner: tx-sender,
        title: title,
        description: description,
        creation-date: current-time,
        registration-date: current-time,
        expiration-date: expiration-date,
        is-active: true
      }
    )
    (ok id)
  )
)

;; Get IP information
(define-read-only (get-ip-info (id uint))
  (map-get? ip-registry { id: id })
)

;; Check if IP is active
(define-read-only (is-ip-active (id uint))
  (default-to false (get is-active (map-get? ip-registry { id: id })))
)

;; Transfer IP ownership
(define-public (transfer-ip (id uint) (new-owner principal))
  (let ((ip-info (map-get? ip-registry { id: id })))
    (asserts! (is-some ip-info) (err u1)) ;; IP must exist
    (asserts! (is-eq tx-sender (get owner (unwrap-panic ip-info))) (err u2)) ;; Must be the owner

    (map-set ip-registry
      { id: id }
      (merge (unwrap-panic ip-info) { owner: new-owner })
    )
    (ok true)
  )
)

;; Update IP status
(define-public (set-ip-status (id uint) (is-active bool))
  (let ((ip-info (map-get? ip-registry { id: id })))
    (asserts! (is-some ip-info) (err u1)) ;; IP must exist
    (asserts! (is-eq tx-sender (get owner (unwrap-panic ip-info))) (err u2)) ;; Must be the owner

    (map-set ip-registry
      { id: id }
      (merge (unwrap-panic ip-info) { is-active: is-active })
    )
    (ok true)
  )
)
