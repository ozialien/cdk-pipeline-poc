package poc.amitk.lambda.sb.api.product;

import org.springframework.data.repository.CrudRepository;

import java.util.List;

/**
 * @author amitkapps
 */
public interface ProductRepository extends CrudRepository<ProductEntity, String> {
    ProductEntity findByProductSku(String productSku);

    List<ProductEntity> findAll();

    ProductEntity save(ProductEntity productEntity);

    void delete(ProductEntity productEntity);

    void deleteAll();
}
