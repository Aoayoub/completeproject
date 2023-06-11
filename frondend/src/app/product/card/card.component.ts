import { Component, OnInit, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product } from '../../shared/interfaces/product';

@Component({
  selector: 'app-product-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.css']
})
export class CardComponent implements OnInit {
  @Input() product: Product;
  selectedImage: File;

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
  }

  onImageSelected(event: any): void {
    this.selectedImage = event.target.files[0];
  }

  onUpload(): void {
    const formData = new FormData();
    formData.append('image', this.selectedImage);

    this.http.post<any>('/api/upload', formData).subscribe(
      (response) => {
        // Handle the response from the server
        this.product.image = response.filename; // Update the product's image property with the filename
      },
      (error) => {
        // Handle the error
        console.log(error);
      }
    );
  }
}
