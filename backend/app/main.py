from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title='Bakery API', version='1.0.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:4200'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

CategoryName = Literal['cupcakes', 'cookies', 'cakes']

MENU = {
    'cupcakes': [
        {
            'id': 'cc-red-velvet',
            'name': 'Red Velvet Cupcake Box',
            'description': 'Six red velvet cupcakes with cream cheese swirls.',
            'price': 24,
        },
        {
            'id': 'cc-vanilla-sprinkle',
            'name': 'Vanilla Sprinkle Cupcakes',
            'description': 'Bright party cupcakes topped with rainbow sprinkles.',
            'price': 21,
        },
    ],
    'cookies': [
        {
            'id': 'ck-choc-chip',
            'name': 'Chocolate Chip Cookie Tin',
            'description': 'Twelve bakery-style cookies with gooey chocolate centers.',
            'price': 18,
        },
        {
            'id': 'ck-macadamia',
            'name': 'White Choc Macadamia Cookies',
            'description': 'Soft-baked cookies finished with toasted macadamias.',
            'price': 20,
        },
    ],
    'cakes': [
        {
            'id': 'ca-strawberry',
            'name': 'Sydney Strawberry Celebration Cake',
            'description': 'Layered vanilla sponge with fresh strawberries and cream.',
            'price': 48,
        },
        {
            'id': 'ca-choc-fudge',
            'name': 'Dark Chocolate Fudge Cake',
            'description': 'Rich chocolate cake with glossy fudge frosting.',
            'price': 52,
        },
    ],
}


class PaymentRequest(BaseModel):
    category: CategoryName
    product_id: str = Field(min_length=3)
    quantity: int = Field(ge=1, le=12)
    customer_name: str = Field(min_length=2)
    city: str = Field(min_length=2)
    state: str = Field(min_length=2)
    country: str = Field(min_length=2)
    currency: str = Field(default='AUD')


@app.get('/api/categories')
def get_categories():
    return {
        'categories': [
            {
                'slug': slug,
                'label': slug.capitalize(),
                'items': items,
            }
            for slug, items in MENU.items()
        ]
    }


@app.post('/api/payments/checkout')
def create_checkout(payload: PaymentRequest):
    if payload.country.strip().lower() != 'australia' or payload.city.strip().lower() != 'sydney':
        raise HTTPException(
            status_code=400,
            detail='Online payments are currently available only for customers in Sydney, Australia.',
        )

    category_items = MENU.get(payload.category, [])
    product = next((item for item in category_items if item['id'] == payload.product_id), None)
    if not product:
        raise HTTPException(status_code=404, detail='Selected bakery item could not be found.')

    total = product['price'] * payload.quantity
    return {
        'status': 'approved',
        'gateway': 'SydneyPay Sandbox',
        'currency': payload.currency,
        'total': total,
        'message': f"Payment session created for {payload.customer_name}. Pick-up is limited to Sydney metro.",
    }
