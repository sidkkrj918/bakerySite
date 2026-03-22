import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

type CategorySlug = 'cupcakes' | 'cookies' | 'cakes';

interface BakeryItem {
  id: string;
  name: string;
  description: string;
  price: number;
}

interface Category {
  slug: CategorySlug;
  label: string;
  items: BakeryItem[];
}

interface CategoryResponse {
  categories: Category[];
}

interface CheckoutForm {
  customer_name: string;
  city: string;
  state: string;
  country: string;
  quantity: number;
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly http = inject(HttpClient);

  protected readonly bakeryName = 'Sweet Crumbs Bakery';
  protected readonly categories = signal<Category[]>([]);
  protected readonly selectedCategory = signal<CategorySlug>('cupcakes');
  protected readonly selectedItemId = signal('');
  protected readonly loading = signal(true);
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly checkoutForm = signal<CheckoutForm>({
    customer_name: '',
    city: 'Sydney',
    state: 'NSW',
    country: 'Australia',
    quantity: 1
  });

  protected readonly activeCategory = computed(
    () => this.categories().find((category) => category.slug === this.selectedCategory()) ?? null
  );

  protected readonly selectedItem = computed(
    () => this.activeCategory()?.items.find((item) => item.id === this.selectedItemId()) ?? null
  );

  constructor() {
    this.loadCategories();
  }

  protected selectCategory(category: CategorySlug): void {
    this.selectedCategory.set(category);
    const firstItem = this.categories().find((entry) => entry.slug === category)?.items[0];
    this.selectedItemId.set(firstItem?.id ?? '');
    this.resetMessages();
  }

  protected selectItem(itemId: string): void {
    this.selectedItemId.set(itemId);
    this.resetMessages();
  }

  protected updateField<K extends keyof CheckoutForm>(field: K, value: CheckoutForm[K]): void {
    this.checkoutForm.update((current) => ({ ...current, [field]: value }));
    this.resetMessages();
  }

  protected checkout(): void {
    const selectedItem = this.selectedItem();
    if (!selectedItem) {
      this.errorMessage.set('Please select a bakery item before starting payment.');
      return;
    }

    this.submitting.set(true);
    this.resetMessages();

    const form = this.checkoutForm();
    this.http
      .post<{ status: string; gateway: string; total: number; currency: string; message: string }>(
        'http://127.0.0.1:8000/api/payments/checkout',
        {
          category: this.selectedCategory(),
          product_id: selectedItem.id,
          quantity: form.quantity,
          customer_name: form.customer_name,
          city: form.city,
          state: form.state,
          country: form.country,
          currency: 'AUD'
        }
      )
      .subscribe({
        next: (response) => {
          this.successMessage.set(
            `${response.message} Total charged: ${response.currency} ${response.total}.`
          );
          this.submitting.set(false);
        },
        error: (error) => {
          this.errorMessage.set(
            error.error?.detail ?? 'Unable to start checkout right now. Please try again.'
          );
          this.submitting.set(false);
        }
      });
  }

  private loadCategories(): void {
    this.http.get<CategoryResponse>('http://127.0.0.1:8000/api/categories').subscribe({
      next: (response) => {
        this.categories.set(response.categories);
        const firstCategory = response.categories[0];
        if (firstCategory) {
          this.selectedCategory.set(firstCategory.slug);
          this.selectedItemId.set(firstCategory.items[0]?.id ?? '');
        }
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Backend unavailable. Start the FastAPI server to load bakery items.');
        this.loading.set(false);
      }
    });
  }

  private resetMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }
}
