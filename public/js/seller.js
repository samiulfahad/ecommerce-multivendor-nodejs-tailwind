const deleteProduct = async (btn) => {
    const parentNode = btn.parentNode
    const productId = parentNode.querySelector('[name=productId]').value
    const csrfToken = parentNode.querySelector('[name=_csrf]').value
    const productElement = btn.closest('article')
    try {
        const response = await fetch(`/seller/product/${productId}`, {
        method: 'DELETE', 
        headers: {
            'csrf-token': csrfToken
            }
        })
        const result = await response.json()
        productElement.remove()
        console.log(result)
    } 
    catch(err) {
        console.log(err)
    }
}