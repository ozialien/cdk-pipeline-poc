package poc.amitk.lambda.sb.api.product;

import poc.amitk.lambda.sb.api.product.Product;
import poc.amitk.lambda.sb.api.product.ProductEntity;

import java.time.ZonedDateTime;

/**
 * @author amitkapps
 */
public class ProductPojoConverter {

    public static Product toProduct(ProductEntity productEntity){
        Product product = new Product();
        product.setProductSku(productEntity.getProductSku());
        product.setProductName(productEntity.getProductName());
        product.setLaunchDate(ZonedDateTime.from(productEntity.getLaunchDate()));
        product.setAddedToCatalogOn( null == productEntity.getCreatedTime() ? null : ZonedDateTime.from(productEntity.getCreatedTime()));
        return product;
    }

    public static ProductEntity toProductEntity(Product product){
        ProductEntity productEntity = new ProductEntity();
        productEntity.setProductSku(product.getProductSku());
        productEntity.setProductName(product.getProductName());
        productEntity.setLaunchDate(ZonedDateTime.from(product.getLaunchDate()));
        productEntity.setCreatedTime(null == product.getAddedToCatalogOn() ? null : ZonedDateTime.from(product.getAddedToCatalogOn()));
        return productEntity;
    }
}
